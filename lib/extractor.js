'use strict';

var utils = require('./utils');
// var _ = utils._;
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
 * @return {Object[]}
 */
Service.prototype.extractEntities = function(context, options) {
	options = options || {};
	var concepts = options.concepts;
	if (!concepts) {
		concepts = this.concepts(context);
	}
	var keys = helpers.formatConceptsKeys(context, concepts, this.formatKey);
	if (keys.length === 0) {
		return keys;
	}

	return this.accessService.entitiesByKeys(keys, {
			params: options.params
		})
		.then(function(entities) {
			entities.forEach(function(entity) {
				entity.concepts = concepts.filter(function(concept) {
					return entity.keys.indexOf(concept.key) > -1;
				});
			});
			return entities;
		});
};

Service.prototype.findUnknownConcepts = function(context, entities, concepts, params) {
	if (entities.length === 0) {
		return Promise.resolve(entities);
	}
	var knownConceptsKeys = [];
	var entitiesHash = {};
	entities.forEach(function(entity) {
		knownConceptsKeys = knownConceptsKeys.concat(entity.keys);
		entitiesHash[entity.id] = entity;
	});

	concepts = helpers.getUnknownConcepts(knownConceptsKeys, concepts);

	if (concepts.length === 0) {
		return Promise.resolve(entities);
	}
	// console.log('unknown concepts', concepts);

	helpers.findPersonsInConcepts(entities, concepts);
	helpers.findEntitiesByAbbr(entities, concepts);

	// console.log('unknown concepts', concepts);

	if (concepts.length > 0) {
		var splitedConcepts = [];

		concepts.forEach(function(concept) {
			splitedConcepts = splitedConcepts.concat(concept.split(context.lang));
		});
		concepts = splitedConcepts;

		// console.log('splited concepts', concepts);

		helpers.formatConceptsKeys(context, concepts, this.formatKey);

		concepts = helpers.findSplitedConcepts(entities, concepts);

		// console.log('filtered concepts', concepts);

		if (concepts.length > 0) {
			return this.extractEntities(context, {
					concepts: concepts,
					params: params
				})
				.then(function(nentities) {
					nentities.forEach(function(item) {
						var entity = entitiesHash[item.id];
						if (entity) {
							entity.concepts = entity.concepts.concat(item.concepts);
						} else {
							entities.push(item);
						}
					});
					return entities;
				});
		}
	}

	return Promise.resolve(entities);
};
