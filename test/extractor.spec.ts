
import { extract } from '../src/extractor';
import { Concept, Entity } from '../src/types';
// import * as mocha from 'mocha';
import * as assert from 'assert';

class FilipRepository {
    entitiesByIds(ids: string[]) {
        const data = [];
        if (~ids.indexOf('ID1')) {
            data.push({ id: 'ID1', name: 'Pavel Filip', type: 'H' });
        }
        return Promise.resolve(data);
    }
    entityIdsByKeys(keys: string[]) {
        const data = {};
        if (~keys.indexOf('ro_Pavel Filip')) {
            data['ro_Pavel Filip'] = ['ID1'];
        }
        return Promise.resolve(data);
    }
}

class FMIRepository {
    entitiesByIds(ids: string[]) {
        const data = [];
        ids.forEach(id => {
            switch (id) {
                case 'ID1':
                    data.push({ id: 'ID1', name: 'Fondul Monetar International', type: 'O' });
                    break;
                case 'ID2':
                    data.push({ id: 'ID2', name: 'False FMI', type: 'O' });
                    break;
                case 'ID3':
                    data.push({ id: 'ID3', name: 'Pavel Filip', type: 'H' });
                    break;
                case 'F3':
                    data.push({ id: 'F3', name: 'P. Filip', type: 'H' });
                    break;
            }
        });
        return Promise.resolve(data);
    }
    entityIdsByKeys(keys: string[]) {
        const data = {};
        if (~keys.indexOf('ro_Fondul Monetar International')) {
            data['ro_Fondul Monetar International'] = ['ID1'];
        }
        if (~keys.indexOf('ro_FMI')) {
            data['ro_FMI'] = ['ID2'];
        }
        if (~keys.indexOf('ro_Pavel Filip')) {
            data['ro_Pavel Filip'] = ['ID3'];
        }
        if (~keys.indexOf('ro_P. Filip')) {
            data['ro_P. Filip'] = ['F3', 'F4'];
        }
        return Promise.resolve(data);
    }
}

function formatKey(name: string, lang: string): string {
    return [lang, name].join('_');
}

describe('Extractor#extract', function () {

    it('should find concepts', function () {
        const context = { lang: 'ro', text: 'De astăzi V. Filat cu Premierul Pavel Filip sunt colegi de cameră. Fondul Monetar International (FMI) s-a spart.' };
        const repository = new FilipRepository();
        return extract<Entity>(context, repository, formatKey)
            .then(result => {
                // console.log(result.concepts);
                assert.ok(result);
                const concepts = result.concepts;
                assert.equal(10, concepts[0].index);
                assert.equal('V. Filat', concepts[0].value);
                assert.equal('FMI', concepts[1].abbr);

                assert.ok(result.entities);
                assert.equal(1, result.entities.length);
                assert.equal('Pavel Filip', result.entities[0].entity.name);
            });
    });

    it('should replace short concepts', function () {
        const context = { lang: 'ro', text: 'De astăzi V. Filat cu Premierul Pavel Filip sunt colegi de cameră. Fondul Monetar International (FMI) s-a spart. FMI ne cere. P. Filip este premier.' };
        const repository = new FMIRepository();

        return extract(context, repository, formatKey)
            .then(result => {
                // console.log(result);
                assert.ok(result);
                const concepts = result.concepts;
                assert.equal(10, concepts[0].index);
                assert.equal('V. Filat', concepts[0].value);

                assert.ok(result.entities);
                assert.equal(2, result.entities.length);
                assert.equal('Pavel Filip', result.entities[0].entity.name);
                assert.equal('Fondul Monetar International', result.entities[1].entity.name);
            });
    });
});
