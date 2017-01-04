'use strict';

var utils = require('./utils');
// var _ = utils._;
var Promise = utils.Promise;
var helpers = require('./helpers');
var storage = require('entitizer.entities-storage');
var formatKey = storage.EntityName.createKey;
var defaultAccessService = new storage.AccessService();

function getConcepts(context, options) {
	var parser = require('concepts-parser');
	return parser.parse(context, options);
}

function getAccessService(options) {
	return options && options.accessService || defaultAccessService;
}

/**
 * Root extract entities from a context.
 */
function extractEntities(context, concepts, accessService) {

	var keys = helpers.formatConceptsKeys(context, concepts, formatKey);
	if (keys.length === 0) {
		return Promise.resolve(keys);
	}

	return accessService.entitiesByKeys(keys)
		.then(function(entities) {
			entities.forEach(function(entity) {
				entity.concepts = concepts.filter(function(concept) {
					return entity.keys.indexOf(concept.key) > -1;
				});
			});
			return entities;
		});
}

function findUnknownConcepts(context, entities, concepts, accessService) {
	// if (entities.length === 0) {
	//  return Promise.resolve(entities);
	// }
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

		helpers.formatConceptsKeys(context, concepts, formatKey);

		concepts = helpers.findSplitedConcepts(entities, concepts);

		// console.log('filtered concepts', concepts);

		if (concepts.length > 0) {
			return extractEntities(context, concepts, accessService)
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
}

/**
 * Extract all entities from concepts.
 * Promise.
 * @param {Object} context - Context
 * @param {Object[]} concepts - a list of concepts.
 * @param  {Object} [options] - Options
 * @param  {Object} [options.accessService] - Access service object.
 * @return {ExtractResult}
 */
function fromConcepts(context, concepts, options) {
	options = options || {};

	if (!concepts || concepts.length === 0) {
		return Promise.resolve({});
	}

	var accessService = getAccessService(options);

	return extractEntities(context, concepts, accessService)
		.then(function(entities) {
			return findUnknownConcepts(context, entities, concepts, accessService);
		})
		.then(helpers.sortEntities);
}

/**
 * Extract all entities from a context.
 * Promise.
 * @param {Object} context - Context
 * @param  {Object} [options] - Options
 * @param  {Object} [options.conceptsOptions] - options
 * @param  {Object} [options.accessService] - Access service object.
 * @return {ExtractResult}
 */
function fromContext(context, options) {
	options = options || {};

	var concepts = getConcepts(context, options.conceptsOptions);

	return fromConcepts(context, concepts, options);
}

// exports: ==========================

exports.fromContext = fromContext;
exports.fromConcepts = fromConcepts;
