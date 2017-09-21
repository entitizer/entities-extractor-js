
import { extract } from '../src/extractor';
import { Concept } from '../src/types';
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
        if (~ids.indexOf('ID1')) {
            data.push({ id: 'ID1', name: 'Fondul Monetar International', type: 'O' });
        }
        if (~ids.indexOf('ID2')) {
            data.push({ id: 'ID2', name: 'False FMI', type: 'O' });
        }
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
        return extract(context, repository, formatKey)
            .then(result => {
                // console.log(result);
                assert.ok(result);
                const concepts = result.keys.reduce((list: Concept[], key) => list.concat(result.concepts[key]), []);
                assert.equal(10, concepts[0].index);
                assert.equal('V. Filat', concepts[0].value);
                assert.equal('Pavel Filip', concepts[1].value);
                assert.equal('FMI', concepts[2].abbr);

                assert.ok(result.entities);
                assert.equal(1, result.entities.length);
                assert.equal('Pavel Filip', result.entities[0].name);
            });
    });

    it('should find concepts', function () {
        const context = { lang: 'ro', text: 'De astăzi V. Filat cu Premierul Pavel Filip sunt colegi de cameră. Fondul Monetar International (FMI) s-a spart. FMI ne cere.' };
        const repository = new FMIRepository();

        return extract(context, repository, formatKey)
            .then(result => {
                // console.log(result);
                assert.ok(result);
                const concepts = result.keys.reduce((list: Concept[], key) => list.concat(result.concepts[key]), []);
                assert.equal(10, concepts[0].index);
                assert.equal('V. Filat', concepts[0].value);
                assert.equal('Pavel Filip', concepts[1].value);
                assert.equal('FMI', concepts[2].abbr);

                assert.ok(result.entities);
                assert.equal(1, result.entities.length);
                assert.equal('Fondul Monetar International', result.entities[0].name);
            });
    });
});
