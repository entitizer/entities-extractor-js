'use strict';

var utils = require('./utils');
var _ = utils._;
var Promise = utils.Promise;
var helpers = require('./helpers');
var storage = require('entitizer.entities-storage');

function Service(accessService) {
	if (!accessService) {
		accessService = new storage.AccessService();
	}
	this.accessService = accessService;
	this.formatKey = storage.EntityName.createKey;
}

module.exports = Service;

/**
 * Returns a list of concepts in a context.
 * Not promise.
 * @param  {Object} context - A context object
 * @param  {Object[]} [concepts] - A list of concepts
 * @return {Object[]}
 */
Service.prototype.concepts = function(context, concepts) {
	if (!concepts) {
		var parser = require('concepts-parser');
		concepts = parser.parse(context);
	}

	return concepts;
};

/**
 * Extract entities list from a extract result object.
 * Not promise.
 * @param {ExtractResult} extractResult - An extract result object
 * @return {Object[]}
 */
Service.prototype.entities = function(extractResult) {
	return helpers.entitiesFromResult(extractResult);
};

/**
 * Extract all entities from a context.
 * Promise.
 * @param {Object} context - Context
 * @param  {Object} [options] - Options
 * @param  {Object[]} [options.concepts] - A list of concepts
 * @param  {Object} [options.params] - AWS Params object used to query entities.
 * @return {ExtractResult}
 */
Service.prototype.extract = function(context, options) {
	options = options || {};

	var concepts = options.concepts;

	if (!concepts) {
		concepts = this.concepts(context);
	}

	if (!concepts || concepts.length === 0) {
		return Promise.resolve({});
	}

	var self = this;

	return this.extractEntities(context, {
			concepts: concepts,
			params: options.params
		})
		.then(function(entities) {
			return self.findUnknownConcepts(context, entities, concepts, options.params);
		});
};

/**
 * Root extract entities from a context.
 * Promise.
 * @param  {Object} context - A context object
 * @param  {String} context.lang - Language 2 chars code
 * @param  {String} context.country - Country 2 chars code
 * @param  {Object} [options] - Options
 * @param  {Object[]} [options.concepts] - A list of concepts
 * @param  {Object} [options.params] - AWS Params object used to query entities.
 * @return {Object}
 */
Service.prototype.extractEntities = function(context, options) {
	options = options || {};
	var concepts = options.concepts;
	var params = options.params || {};
	if (!concepts) {
		concepts = this.concepts(context);
	}
	var keys = helpers.formatConceptsKeys(context, concepts, this.formatKey);
	if (keys.length === 0) {
		return {};
	}

	params = _.defaults(params, {
		AttributesToGet: ['id', 'name', 'slug', 'lang', 'country', 'type', 'region']
			// ProjectionExpression: 'id, name, slug, lang, country, type, region'
	});

	return this.accessService.entitiesByKeys(keys, {
			params: params
		})
		.then(function(entities) {
			Object.keys(entities).forEach(function(key) {
				entities[key].concepts = concepts.filter(function(concept) {
					return concept.key === key;
				});
			});
			return entities;
		});
};

Service.prototype.findUnknownConcepts = function(context, entities, concepts, params) {
	var keys = Object.keys(entities);
	if (keys.length === 0) {
		return Promise.resolve(entities);
	}
	concepts = helpers.getUnknownConcepts(keys, concepts);
	// console.log('unknown concepts', concepts);

	helpers.findPersonsInConcepts(entities, concepts);
	helpers.findEntitiesByAbbr(entities, concepts);

	if (concepts.length > 0) {
		var newConcepts = [];
		concepts.forEach(function(concept) {
			newConcepts = newConcepts.concat(concept.split(context.lang));
		});
		concepts = newConcepts;
		helpers.formatConceptsKeys(context, concepts, this.formatKey);

		concepts = concepts.filter(function(concept) {
			if (entities[concept.key]) {
				entities[concept.key].concepts.push(concept);
				return false;
			} else {
				for (var key in entities) {
					if (entities[key].key === concept.key) {
						entities[key].concepts.push(concept);
						return false;
					}
				}
			}
			return true;
		});

		if (concepts.length > 0) {
			return this.extractEntities(context, {
					concepts: concepts,
					params: params
				})
				.then(function(nentities) {
					return _.merge(entities, nentities);
				});
		}
	}

	return Promise.resolve(entities);
};
