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
		}];

		return Promise.each(entities, function(entity) {
			return controlService.createEntity(entity)
				.then(function(dbEntity) {
					return Promise.each(dbEntity.names, function(name) {
						name.entityId = dbEntity.id;
						return controlService.createNameKey(name);
					});
				});
		});
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
		text: 'Vlad Filat este noul prim-ministru al R. Moldova. Partidul Socialistilor este condus de Dodon. Igor Dodon merge in Rusia.'
	};

	it('#concepts', function() {
		var concepts = extractor.concepts(context);
		assert.equal(6, concepts.length);
		assert.equal('R. Moldova', concepts[1].value);
		// console.log(concepts);
	});

	it('#entities', function() {
		return extractor.extract(context).then(function(result) {
			var entities = extractor.entities(result);

			assert.ok(entities);
			assert.equal(3, entities.length);
			var dodon = _.find(entities, {
				name: 'Igor Dodon'
			});
			assert.equal(2, dodon.concepts.length);
		});
	});
});
