'use strict';

var utils = require('./utils');
var _ = utils._;

exports.formatConceptsKeys = function(context, concepts, formatKey) {
	var keys = [];
	concepts.forEach(function(concept) {
		concept.key = concept.key || formatKey(concept.atonic, context.lang, context.country);
		keys.push(concept.key);
	});

	return _.uniq(keys);
};

exports.entitiesFromResult = function(result) {
	var ids = {};
	var entities = [];
	Object.keys(result).forEach(function(key) {
		var entity = result[key];
		if (ids[entity.id]) {
			if (entity.concepts) {
				entities[ids[entity.id] - 1].concepts = _.uniq(entities[ids[entity.id] - 1].concepts.concat(entity.concepts), 'index');
			}
		} else {
			ids[entity.id] = entities.length + 1;
			entities.push(entity);
		}
	});

	return entities;
};

/**
 * Find entities by abbr
 */
exports.findEntitiesByAbbr = function(entities, unknownConcepts) {
	if (unknownConcepts.length === 0) {
		return;
	}
	var keys = Object.keys(entities).filter(function(key) {
		return entities[key].abbr;
	});
	if (keys.length === 0) {
		return;
	}

	var i;

	for (i = 0; i < unknownConcepts.length; i++) {
		var concept = unknownConcepts[i];
		if (entities[concept.key]) {
			unknownConcepts.splice(i, 1);
			i--;
			entities[concept.key].concepts.push(concept);
			//console.log('found abbr 2:', concept, entities[concept.key]);
			continue;
		}
		for (var j = keys.length - 1; j >= 0; j--) {
			var entity = entities[keys[j]];
			//console.log('abbr', _.pick(entity, 'id', 'name', 'type'), concept);
			if (concept.value === entity.abbr) {
				unknownConcepts.splice(i, 1);
				i--;
				entities[concept.key] = _.clone(entity);
				entities[concept.key].concepts = [concept];
				//console.log('found abbr:', concept, entity);
				break;
			}
		}
	}
};

/**
 * Find persons in unknown concepts
 */
exports.findPersonsInConcepts = function(entities, unknownConcepts) {
	if (unknownConcepts.length === 0) {
		return;
	}
	var personKeys = Object.keys(entities).filter(function(key) {
		return entities[key].type === 'person';
	});
	if (personKeys.length === 0) {
		return;
	}

	var i;

	for (i = 0; i < unknownConcepts.length; i++) {
		var concept = unknownConcepts[i];
		if (entities[concept.key]) {
			unknownConcepts.splice(i, 1);
			i--;
			entities[concept.key].concepts.push(concept);
			// console.log('found persoon 2:', concept, entities[concept.key]);
			continue;
		}
		for (var j = personKeys.length - 1; j >= 0; j--) {
			var person = entities[personKeys[j]];
			// console.log('person', _.pick(person, 'id', 'name', 'type'), concept);
			if (_.endsWith(person.name.toLowerCase(), ' ' + concept.value.toLowerCase()) ||
				_.endsWith(person.name.toLowerCase(), ' ' + concept.atonic.toLowerCase())) {
				unknownConcepts.splice(i, 1);
				i--;
				entities[concept.key] = _.clone(person);
				entities[concept.key].concepts = [concept];
				// console.log('found persoon:', concept, person);
				break;
			}
		}
	}
};

exports.getUnknownConcepts = function(keys, concepts) {
	var list = [];

	concepts.forEach(function(concept) {
		if (keys.indexOf(concept.key) < 0) {
			list.push(concept);
		}
	});

	return list;
};
