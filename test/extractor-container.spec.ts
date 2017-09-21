
import { ExtractorContainer } from '../src/extractor-container';
import { Entity, Concept } from '../src/types';
import * as assert from 'assert';
import { parse } from 'concepts-parser';


function formatKey(name: string, lang: string): string {
    return [lang, name.replace(/\s+/g, '_')].join('_');
}

describe('ExtractorContainer', function () {
    it(`should fail: constructor invalid arguments`, function () {
        assert.throws(function () { new ExtractorContainer(null, formatKey); }, 'null lang');
        assert.throws(function () { new ExtractorContainer('ro', null); }, 'null formatKey fn');
        assert.throws(function () { new ExtractorContainer(null, undefined); }, 'null lang undefined formatKey fn');
    });

    it(`should fail: set invalid arguments`, function () {
        const container = new ExtractorContainer('ro', formatKey);
        assert.throws(function () { container.setRootConcepts(null) }, 'null root concepts');
        assert.throws(function () { container.setEntities(null) }, 'null entities');
        assert.throws(function () { container.addEntityIds(null) }, 'null entityIds');
        assert.throws(function () { container.addSplittedConcepts(null, []) }, 'null splitted concepts parent');
    });

    it(`should set root concepts`, function () {
        const context = { lang: 'ro', text: 'Moldova este un stat localizat în sud-estul Europei, care se învecinează cu România la vest și cu Ucraina la nord, est și sud.' };
        const container = new ExtractorContainer(context.lang, formatKey);
        const concepts = parse(context);
        assert.equal(concepts.length, 4, 'parsed concepts=4');

        container.setRootConcepts(concepts.map(c => new Concept(c)));

        const rootConcepts = container.getRootConcepts();

        assert.equal(concepts.length, rootConcepts.list.length, 'parsed concepts must be equal with root concepts');
        assert.equal(concepts.length, rootConcepts.keys.length, 'parsed concepts must be equal with root concepts keys');

        const allConcepts = container.getAllConcepts();

        assert.equal(concepts.length, allConcepts.list.length, 'parsed concepts must be equal with all concepts');
        assert.equal(concepts.length, allConcepts.keys.length, 'parsed concepts must be equal with all concepts keys');

        const rootUnknowConcepts = container.getRootUnknownConcepts();

        assert.equal(concepts.length, rootUnknowConcepts.list.length, 'parsed concepts must be equal with root unknown concepts');
        assert.equal(concepts.length, rootUnknowConcepts.keys.length, 'parsed concepts must be equal with root unknown concepts keys');

        const splittedConcepts = container.getSplittedConcepts();

        assert.equal(0, splittedConcepts.list.length, 'splitted concepts must be 0');
        assert.equal(0, splittedConcepts.keys.length, 'splitted concepts keys must be 0');

        const splittedUnknownConcepts = container.getSplittedUnknownConcepts();

        assert.equal(0, splittedUnknownConcepts.list.length, 'splitted unknown concepts must be 0');
        assert.equal(0, splittedUnknownConcepts.keys.length, 'splitted unknown concepts keys must be 0');

        const ids = container.getIds();

        assert.equal(0, ids.length, 'ids must be 0');

        const result = container.getResult();

        assert.equal(result.concepts.length, rootConcepts.list.length, 'result concepts = root concepts');
        assert.equal(result.entities.length, 0, 'result entities = 0');
    });

    it(`should add entity ids`, function () {
        const context = { lang: 'ro', text: 'Moldova este un stat localizat în sud-estul Europei, care se învecinează cu România la vest și cu Ucraina la nord, est și sud.' };
        const container = new ExtractorContainer(context.lang, formatKey);
        const concepts = parse(context);
        assert.equal(concepts.length, 4, 'parsed concepts=4');

        container.setRootConcepts(concepts.map(c => new Concept(c)));

        container.addEntityIds({ 'ro_Moldova': ['MD'] });

        let rootUnknowConcepts = container.getRootUnknownConcepts();

        assert.equal(concepts.length - 1, rootUnknowConcepts.list.length, 'root unknown concepts = concepts-1');
        assert.equal(concepts.length - 1, rootUnknowConcepts.keys.length, 'root unknown concepts keys = concepts-1');

        let ids = container.getIds();

        assert.equal(1, ids.length, 'ids must be 1');

        container.addEntityIds({ 'ro_Europei': ['EU'] });
        container.addEntityIds({ 'ro_Ucraina': [] });

        rootUnknowConcepts = container.getRootUnknownConcepts();

        assert.equal(concepts.length - 2, rootUnknowConcepts.list.length, 'root unknown concepts = concepts-2');
        assert.equal(concepts.length - 2, rootUnknowConcepts.keys.length, 'root unknown concepts keys = concepts-2');

        ids = container.getIds();

        assert.equal(2, ids.length, 'ids must be 2');

        const result = container.getResult();

        assert.equal(result.concepts.length, rootUnknowConcepts.list.length, 'result concepts = root unknown concepts');
        assert.equal(result.concepts.length, 2, 'result concepts = 2');
        assert.equal(result.entities.length, 0, 'result entities = 0');
    });

    it(`should add splitted concepts`, function () {
        const context = { lang: 'ro', text: 'Moldova este un stat localizat în sud-estul Europei, care se învecinează cu România Mare la vest și cu Ucraina la nord, est și sud.' };
        const container = new ExtractorContainer(context.lang, formatKey);
        const concepts = parse(context);
        assert.equal(concepts.length, 4, 'parsed concepts=4');

        container.setRootConcepts(concepts.map(c => new Concept(c)));
        container.addEntityIds({ 'ro_Moldova': ['MD'], 'ro_Europei': ['EU'] });
        const romaniaMare = new Concept(concepts[2]);
        container.addSplittedConcepts(romaniaMare, romaniaMare.split(context.lang).map(c => new Concept(c)));

        const splittedConcepts = container.getSplittedConcepts();
        assert.equal(splittedConcepts.list.length, 2, '2 splitted concepts');
        assert.equal(splittedConcepts.keys.length, 2, '2 splitted concepts keys');

        const splittedUnknownConcepts = container.getSplittedUnknownConcepts();
        assert.equal(splittedUnknownConcepts.list.length, 2, '2 splitted unknown concepts');
        assert.equal(splittedUnknownConcepts.keys.length, 2, '2 splitted unknown concepts keys');

        const allConcepts = container.getAllConcepts();

        assert.equal(allConcepts.list.length, concepts.length + 2, 'all concepts==root concepts + splitted concepts');
        assert.equal(allConcepts.keys.length, concepts.length + 2, 'all concepts keys==root concepts key + splitted concepts keys');

        const rootUnknowConcepts = container.getRootUnknownConcepts();

        const result = container.getResult();
        // console.log(result.concepts)

        assert.equal(result.concepts.length, rootUnknowConcepts.list.length, 'result concepts = root unknown concepts');
        assert.equal(result.concepts.length, 2, 'result concepts = 2');
        assert.equal(result.entities.length, 0, 'result entities = 0');
    });

    it(`should set entities`, function () {
        const context = { lang: 'ro', text: 'Moldova este un stat localizat în sud-estul Europei, care se învecinează cu România Mare la vest și cu Ucraina la nord, est și sud.' };
        const container = new ExtractorContainer<Entity>(context.lang, formatKey);
        const concepts = parse(context);
        assert.equal(concepts.length, 4, 'parsed concepts=4');

        container.setRootConcepts(concepts.map(c => new Concept(c)));
        container.addEntityIds({ 'ro_Moldova': ['MD'], 'ro_România': ['RO'] });
        const romaniaMare = new Concept(concepts[2]);
        container.addSplittedConcepts(romaniaMare, romaniaMare.split(context.lang).map(c => new Concept(c)));

        const splittedConcepts = container.getSplittedConcepts();
        assert.equal(splittedConcepts.list.length, 2, '2 splitted concepts');
        assert.equal(splittedConcepts.keys.length, 2, '2 splitted concepts keys');

        const splittedUnknownConcepts = container.getSplittedUnknownConcepts();
        assert.equal(splittedUnknownConcepts.list.length, 1, '1 splitted unknown concepts');
        assert.equal(splittedUnknownConcepts.keys.length, 1, '1 splitted unknown concepts keys');

        const allConcepts = container.getAllConcepts();

        assert.equal(allConcepts.list.length, concepts.length + 2, 'all concepts==root concepts + splitted concepts');
        assert.equal(allConcepts.keys.length, concepts.length + 2, 'all concepts keys==root concepts key + splitted concepts keys');

        container.setEntities([{ id: 'MD', name: 'Moldova' }, { id: 'RO', name: 'Romania' }]);

        const rootUnknowConcepts = container.getRootUnknownConcepts();

        const result = container.getResult();

        assert.equal(result.concepts.length, rootUnknowConcepts.list.length, 'result concepts = root unknown concepts');
        assert.equal(result.entities.length, 2, 'result entities = 2');
        assert.equal(result.entities[0].entity.id, 'MD');
        assert.equal(result.entities[0].concepts.length, 1, 'one MD concepts');
        assert.equal(result.entities[1].entity.id, 'RO');
        assert.equal(result.entities[1].concepts.length, 1, 'one RO concepts');
    });
});