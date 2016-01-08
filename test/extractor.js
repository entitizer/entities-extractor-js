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
			assert.equal(7, entities.length);
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

	it('#fromContext sort', function() {
		return extractor.fromContext({
			lang: 'ro',
			country: 'md',
			text: 'Comisia Europeană a adoptat o serie de programe de cooperare transfrontalieră, care au un buget total de un miliard de euro și sunt destinate să sprijine dezvoltarea socială și economică a regiunilor situate de ambele părți ale frontierelor externe ale UE.\n„Cooperarea transfrontalieră este esențială pentru evitarea creării unor noi linii de separare. Această nouă finanțare va contribui la o dezvoltare regională mai integrată și mai durabilă a regiunilor frontaliere învecinate și la o cooperare teritorială mai armonioasă în zona frontierelor externe ale UE”, a declarat Johannes Hahn, comisarul pentru politica europeană de vecinătate și negocieri privind extinderea, potrivit unui comunicat transmis joi de Reprezentanța CE la București, notează Agerpres.ro.\n„Sunt foarte mulțumită că Fondul European de Dezvoltare Regională poate contribui la apropierea UE de vecinii săi. Programele de cooperare transfrontalieră reprezintă exemple concrete ale modului în care UE acționează pentru a-i ajuta pe cetățeni să facă față unor provocări comune, creând astfel un veritabil sentiment de solidaritate și stimulând în același timp competitivitatea economiilor locale”, a declarat Corina Crețu, comisarul pentru politica regională.'
		}).then(function(entities) {
			assert.ok(entities);
			assert.equal('Comisia Europeană', entities[0].name);
		});
	});

	it('#fromConcepts', function() {
		var concepts = Data.conceptsParser.parse(context);
		return extractor.fromConcepts(context, concepts)
			.then(function(entities) {
				assert.ok(entities);
				// console.log('entities', entities);
				assert.equal(7, entities.length);
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
