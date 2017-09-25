
import { DataContainer } from '../src/data-container';
import { Entity, Concept } from '../src/types';
import { formatExtractorResult } from '../src/actions';
import * as assert from 'assert';
import { parse } from 'concepts-parser';


function formatKey(name: string, lang: string): string {
    return [lang, name.replace(/\s+/g, '_')].join('_');
}

describe('DataContainer', function () {
    it(`should fail: constructor invalid arguments`, function () {
        assert.throws(function () { new DataContainer(null, null, formatKey); }, 'null lang');
        assert.throws(function () { new DataContainer(null, { lang: 'ro', text: null }, null); }, 'null formatKey fn');
        assert.throws(function () { new DataContainer(null, null, undefined); }, 'null lang undefined formatKey fn');
    });

    it(`should fail: set invalid arguments`, function () {
        const container = new DataContainer([], { lang: 'ro', text: null }, formatKey);
        assert.throws(function () { container.setEntities(null) }, 'null entities');
        assert.throws(function () { container.addEntityIds(null) }, 'null entityIds');
    });

    it(`should set root concepts`, function () {
        const context = { lang: 'ro', text: 'Moldova este un stat localizat în sud-estul Europei, care se învecinează cu România la vest și cu Ucraina la nord, est și sud.' };
        const concepts = parse(context).map(c => new Concept(c));
        const container = new DataContainer(concepts, context, formatKey);

        assert.equal(concepts.length, 4, 'parsed concepts=4');

        const rootConcepts = container.getConcepts();

        assert.equal(concepts.length, rootConcepts.length, 'parsed concepts must be equal with root concepts');
        assert.equal(concepts.length, container.getConceptKeys().length, 'parsed concepts must be equal with root concepts keys');

        const rootUnknowConcepts = container.getUnknownConceptKeys();

        assert.equal(concepts.length, rootUnknowConcepts.length, 'parsed concepts must be equal with root unknown concepts');
        assert.equal(concepts.length, container.getUnknownConceptKeys().length, 'parsed concepts must be equal with root unknown concepts keys');

        const splittedConcepts = container.getSplittedConcepts();

        assert.equal(0, splittedConcepts.length, 'splitted concepts must be 0');
        assert.equal(0, container.getSplittedConceptsKeys().length, 'splitted concepts keys must be 0');

        const splittedUnknownConcepts = container.getSplittedUnknownConceptKeys();

        assert.equal(0, splittedUnknownConcepts.length, 'splitted unknown concepts must be 0');

        const ids = container.getEntityIds();

        assert.equal(0, ids.length, 'ids must be 0');

        const result = formatExtractorResult<Entity>(container);

        assert.equal(result.concepts.length, rootConcepts.length, 'result concepts = root concepts');
        assert.equal(result.entities.length, 0, 'result entities = 0');
    });

    it(`should add entity ids`, function () {
        const context = { lang: 'ro', text: 'Moldova este un stat localizat în sud-estul Europei, care se învecinează cu România la vest și cu Ucraina la nord, est și sud.' };
        const concepts = parse(context).map(c => new Concept(c));
        const container = new DataContainer(concepts, context, formatKey);

        assert.equal(concepts.length, 4, 'parsed concepts=4');

        container.addEntityIds({ 'ro_Moldova': ['MD'] });

        let rootUnknowConcepts = container.getUnknownConceptKeys();

        assert.equal(concepts.length - 1, rootUnknowConcepts.length, 'root unknown concepts = concepts-1');

        let ids = container.getEntityIds();

        assert.equal(1, ids.length, 'ids must be 1');

        container.addEntityIds({ 'ro_Europei': ['EU'] });
        container.addEntityIds({ 'ro_Ucraina': [] });

        rootUnknowConcepts = container.getUnknownConceptKeys();

        assert.equal(concepts.length - 2, rootUnknowConcepts.length, 'root unknown concepts = concepts-2');

        ids = container.getEntityIds();

        assert.equal(2, ids.length, 'ids must be 2');

        const result = formatExtractorResult(container);

        assert.equal(result.concepts.length, rootUnknowConcepts.length, 'result concepts = root unknown concepts');
        assert.equal(result.concepts.length, 2, 'result concepts = 2');
        assert.equal(result.entities.length, 0, 'result entities = 0');
    });

    it(`should add splitted concepts`, function () {
        const context = { lang: 'ro', text: 'Moldova este un stat localizat în sud-estul Europei, care se învecinează cu România Mare la vest și cu Ucraina la nord, est și sud.' };
        const concepts = parse(context).map(c => new Concept(c));
        const container = new DataContainer(concepts, context, formatKey);
        assert.equal(concepts.length, 4, 'parsed concepts=4');
        container.addEntityIds({ 'ro_Moldova': ['MD'], 'ro_Europei': ['EU'] });
        const romaniaMare = new Concept(concepts[2]);
        container.addConcepts(romaniaMare.split(context.lang).map(c => new Concept(c)), romaniaMare);

        const splittedConcepts = container.getSplittedConcepts();
        assert.equal(splittedConcepts.length, 2, '2 splitted concepts');
        assert.equal(container.getSplittedConceptsKeys().length, 2, '2 splitted concepts keys');

        const splittedUnknownConcepts = container.getSplittedUnknownConceptKeys();
        assert.equal(splittedUnknownConcepts.length, 2, '2 splitted unknown concepts');

        const result = formatExtractorResult(container);

        assert.equal(result.concepts.length, 2, 'result concepts = 2');
        assert.equal(result.entities.length, 0, 'result entities = 0');
    });

    it(`should set entities`, function () {
        const context = { lang: 'ro', text: 'Moldova este un stat localizat în sud-estul Europei, care se învecinează cu România Mare la vest și cu Ucraina la nord, est și sud.' };
        const concepts = parse(context).map(c => new Concept(c));
        const container = new DataContainer(concepts, context, formatKey);
        assert.equal(concepts.length, 4, 'parsed concepts=4');
        container.addEntityIds({ 'ro_Moldova': ['MD'], 'ro_România': ['RO'] });
        const romaniaMare = new Concept(concepts[2]);
        container.addConcepts(romaniaMare.split(context.lang).map(c => new Concept(c)), romaniaMare);

        const splittedConcepts = container.getSplittedConcepts();
        assert.equal(splittedConcepts.length, 2, '2 splitted concepts');
        assert.equal(container.getSplittedConceptsKeys().length, 2, '2 splitted concepts keys');

        container.setEntities([{ id: 'MD', name: 'Moldova' }, { id: 'RO', name: 'Romania' }]);

        const result = formatExtractorResult<Entity>(container);

        assert.equal(result.entities.length, 2, 'result entities = 2');
        assert.equal(result.entities[0].entity.id, 'MD');
        assert.equal(result.entities[0].concepts.length, 1, 'one MD concepts');
        assert.equal(result.entities[1].entity.id, 'RO');
        assert.equal(result.entities[1].concepts.length, 1, 'one RO concepts');
    });
});
