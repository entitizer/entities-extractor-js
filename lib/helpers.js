'use strict';

var utils = require('./utils');
var _ = utils._;

// exports.normalizeEntities = function(entities) {

// };

exports.formatConceptsKeys = function(context, concepts, formatKey) {
	var keys = [];
	concepts.forEach(function(concept) {
		concept.key = concept.key || formatKey(concept.atonic, context.lang, context.country);
		keys.push(concept.key);
	});

	return _.uniq(keys);
};

exports.findSplitedConcepts = function(entities, unknownConcepts) {
	unknownConcepts = _.sortBy(unknownConcepts, 'value.length').reverse();
	// console.log('slited concepts sorted', unknownConcepts);
	var foundedConcepts = [];
	var unknownConcepts = unknownConcepts.filter(function(concept) {
		// find entity with same concept
		var entity = _.find(entities, function(item) {
			return item.keys.indexOf(concept.key) > -1 || item.name === concept.atonic || item.name === concept.value;
		});
		if (entity) {
			var limit = concept.index + concept.value.length;
			var parentConcept = _.find(entity.concepts, function(item) {
				return concept.index >= item.index && concept.index < item.index + item.value.length;
				// return concept.index >= item.index && limit <= (item.index + item.value.length);
			});
			if (!parentConcept) {
				entity.concepts.push(concept);
				foundedConcepts.push(concept);
			}
			return false;
		}
		return true;
	});

	if (foundedConcepts.length > 0 && unknownConcepts.length > 0) {
		unknownConcepts.forEach(function(unknownConcept, i) {
			foundedConcepts.forEach(function(concept) {
				if (concept.index >= unknownConcept.index && concept.index <= unknownConcept.index + unknownConcept.value.length) {
					// console.log('remove', unknownConcept);
					unknownConcepts.splice(i, 1);
				}
			});
		});
	}

	return unknownConcepts;
};

/**
 * Find entities by abbr
 */
exports.findEntitiesByAbbr = function(entities, unknownConcepts) {
	if (unknownConcepts.length === 0) {
		return unknownConcepts;
	}
	var entitiesWithAbbr = entities.filter(function(item) {
		return !!item.abbr;
	});
	if (entitiesWithAbbr.length === 0) {
		return unknownConcepts;
	}

	entitiesWithAbbr.forEach(function(entity) {
		for (var i = 0; i < unknownConcepts.length; i++) {
			var concept = unknownConcepts[i];

			if (entity.abbr === concept.value) {
				unknownConcepts.splice(i, 1);
				i--;
				entity.concepts.push(concept);
				entity.keys.push(concept.key);
			}
		}
	});

	return unknownConcepts;
};

/**
 * Find persons in unknown concepts
 */
exports.findPersonsInConcepts = function(entities, unknownConcepts) {
	if (unknownConcepts.length === 0) {
		return unknownConcepts;
	}
	var persons = entities.filter(function(item) {
		return item.type === 'person';
	});
	if (persons.length === 0) {
		return unknownConcepts;
	}

	persons.forEach(function(person) {
		var personName = person.name.toLowerCase();
		for (var i = 0; i < unknownConcepts.length; i++) {
			var concept = unknownConcepts[i];

			if (_.endsWith(personName, ' ' + concept.value.toLowerCase()) ||
				_.endsWith(personName, ' ' + concept.atonic.toLowerCase())) {
				unknownConcepts.splice(i, 1);
				i--;
				person.concepts.push(concept);
				person.keys.push(concept.key);
			}
		}
	});

	return unknownConcepts;
};

exports.getUnknownConcepts = function(keys, concepts) {
	return concepts.filter(function(concept) {
		return keys.indexOf(concept.key) < 0;
	});
};
