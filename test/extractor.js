'use strict';

var Data = require('./common/data');
if (!Data) {
	return;
}

var extractor = Data.extractor;
var controlService = Data.controlService;

var assert = require('assert');
var Promise = require('bluebird');
var _ = require('lodash');

describe('Extractor', function() {
	this.timeout(1000 * 60);

	function createEntities() {
		var entities = [{
			id: 1,
			name: 'Moldova',
			lang: 'ro',
			country: 'md',
			abbr: 'RM',
			names: [{
				name: 'R. Moldova'
			}, {
				name: 'Republica Moldova'
			}]
		}, {
			id: 2,
			name: 'Vlad Filat',
			lang: 'ro',
			country: 'md',
			type: 'person',
			names: [{
				name: 'V. Filat'
			}]
		}, {
			id: 3,
			name: 'Igor Dodon',
			lang: 'ro',
			country: 'md',
			type: 'person'
		}, {
			id: 4,
			name: 'Uniunea Europeana',
			abbr: 'UE',
			lang: 'ro',
			country: 'md'
		}];

		return Promise.each(entities, function(entity) {
			return controlService.createEntity(entity)
				.then(function(dbEntity) {
					var names = entity.names || [];
					names.push({
						name: entity.name
					});
					return Promise.each(names, function(name) {
						name.entity = dbEntity;
						return controlService.createEntityName(name);
					});
				});
		}).delay(1000 * 2);
	}

	before('createTables', function() {
		return Data.createTables().then(createEntities);
	});

	after('deleteTables', function() {
		return Data.deleteTables('iam-sure')
			.then(function() {
				return Promise.delay(1000 * 5);
			});
	});

	var context = {
		lang: 'ro',
		country: 'md',
		text: 'Vlad Filat este noul prim-ministru al R. Moldova. Partidul Socialistilor din Moldova este condus de Dodon. Igor Dodon merge in Rusia, RM iar Filat stie de Uniunea Europeana si vrea in UE. Premierul Vlad Filat merge la Moscova.'
	};

	// it('#concepts', function() {
	// 	var concepts = extractor.concepts(context);
	// 	// console.log('concepts', concepts);
	// 	assert.equal(12, concepts.length);
	// 	assert.equal('R. Moldova', concepts[1].value);
	// });

	it('#fromContext', function() {
		return extractor.fromContext(context).then(function(entities) {
			assert.ok(entities);
			// console.log('entities', entities);
			assert.equal(4, entities.length);
			var dodon = _.find(entities, {
				name: 'Igor Dodon'
			});
			assert.equal(2, dodon.concepts.length);
			// test split
			var filat = _.find(entities, {
				name: 'Vlad Filat'
			});
			assert.equal(3, filat.concepts.length);
			assert.equal(2, filat.keys.length);
		});
	});

	it('#fromConcepts', function() {
		var concepts = Data.conceptsParser.parse(context);
		return extractor.fromConcepts(context, concepts)
			.then(function(entities) {
				assert.ok(entities);
				// console.log('entities', entities);
				assert.equal(4, entities.length);
				var dodon = _.find(entities, {
					name: 'Igor Dodon'
				});
				assert.equal(2, dodon.concepts.length);
				// test split
				var filat = _.find(entities, {
					name: 'Vlad Filat'
				});
				assert.equal(3, filat.concepts.length);
				assert.equal(2, filat.keys.length);
			});
	});
});
