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

Service.prototype.concepts = function(context, concepts) {
	if (!concepts) {
		var parser = require('concepts-parser');
		concepts = parser.parse(context);
	}

	return concepts;
};

/**
 * Extract entities list from context.
 * @param {Object} context - Context
 * @param {Object[]} [concepts] - Concepts
 * @return {Object[]}
 */
Service.prototype.entities = function(context, concepts) {
	return this.extract(context, concepts)
		.then(function(result) {
			return helpers.entitiesFromResult(result);
		});
};

/**
 * Extract entities from context.
 * @param {Object} context - Context
 * @param {Object[]} [concepts] - Concepts
 * @return {Object}
 */
Service.prototype.extract = function(context, concepts) {

	concepts = this.concepts(context);

	if (!concepts || concepts.length === 0) {
		return Promise.resolve({});
	}

	var self = this;

	return this.extractEntities(context, concepts)
		.then(function(entities) {
			return self.findUnknownConcepts(entities, context, concepts);
		});
};

Service.prototype.findUnknownConcepts = function(entities, context, concepts) {
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
			return this.extractEntities(context, concepts)
				.then(function(nentities) {
					return _.merge(entities, nentities);
				});
		}
	}

	return Promise.resolve(entities);
};

/**
 * Find entities by concepts.
 * @param  {Object} context - A context object
 * @param  {String} context.lang - Language 2 chars code
 * @param  {String} context.country - Country 2 chars code
 * @param  {Object[]} concepts - A list of concepts
 * @return {Object}
 */
Service.prototype.extractEntities = function(context, concepts) {
	var keys = helpers.formatConceptsKeys(context, concepts, this.formatKey);
	return this.accessService.entitiesByKeys(keys)
		.then(function(entities) {
			Object.keys(entities).forEach(function(key) {
				entities[key].concepts = concepts.filter(function(concept) {
					return concept.key === key;
				});
			});
			return entities;
		});
};
