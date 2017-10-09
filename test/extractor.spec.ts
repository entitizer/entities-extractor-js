
import { extract } from '../src/extractor';
import { Concept, Entity, PlainObject } from '../src/types';
import * as assert from 'assert';

class MockRepository {
    constructor(private idsByKey: PlainObject<string[]>, private entitiesById: PlainObject<Entity>) { }
    entitiesByIds(ids: string[]) {
        const data = ids.map(id => this.entitiesById[id]).filter(item => !!item);
        return Promise.resolve(data);
    }
    entityIdsByKeys(keys: string[]) {
        const data = {};
        keys.forEach(key => {
            const ids = this.idsByKey[key];
            if (ids) {
                data[key] = ids;
            }
        });
        return Promise.resolve(data);
    }
}

function formatKey(name: string, lang: string): string {
    return [lang, name].join('_');
}

describe('Extractor#extract', function () {

    it('should find short concepts (Pavel Filip -> P. Filip)', function () {
        const context = { lang: 'ro', text: 'De astăzi V. Filat cu Premierul P. Filip sunt colegi de cameră. Fondul Monetar International (FMI) s-a spart. Pavel Filip este pentru P Filip. FMI vine azi la tară.' };
        const repository = new MockRepository(
            {
                'ro_Pavel Filip': ['filip']
            },
            {
                filip: { id: 'filip', name: 'Pavel Filip', type: 'H' }
            });
        return extract<Entity>(context, repository, formatKey)
            .then(result => {
                assert.ok(result);
                const concepts = result.concepts;
                assert.equal(10, concepts[0].index);
                assert.equal('V. Filat', concepts[0].value);
                assert.equal('FMI', concepts[1].abbr);
                assert.equal('Fondul Monetar International', concepts[1].value);

                assert.ok(result.entities);
                assert.equal(1, result.entities.length);
                const filipItem = result.entities[0];
                assert.equal('Pavel Filip', filipItem.entity.name);
                assert.equal(3, filipItem.concepts.length);
                assert.equal('P. Filip', filipItem.concepts[0].value);
                assert.equal('Pavel Filip', filipItem.concepts[1].value);
                assert.equal('P Filip', filipItem.concepts[2].value);
            });
    });

    it('should find short concepts (Fondul Monetar International -> FMI)', function () {
        const context = { lang: 'ro', text: 'Fondul Monetar International (FMI) s-a spart. FMI vine azi la tară.' };
        const repository = new MockRepository(
            {
                'ro_FMI': ['fmi']
            },
            {
                fmi: { id: 'fmi', name: 'Fondul Monetar International', type: 'O' }
            });
        return extract<Entity>(context, repository, formatKey)
            .then(result => {
                // console.log(JSON.stringify(result));
                assert.ok(result);

                assert.ok(result.entities);
                assert.equal(1, result.entities.length);

                const fmiItem = result.entities[0];
                assert.equal('Fondul Monetar International', fmiItem.entity.name);
                assert.equal(3, fmiItem.concepts.length, 'FMI: should find 2 ABBR & a long name');
                assert.equal('Fondul Monetar International', fmiItem.concepts[0].value);
                assert.equal('FMI', fmiItem.concepts[1].value);
                assert.equal('FMI', fmiItem.concepts[2].value);
            });
    });
});
