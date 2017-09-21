
import { extract } from '../src/extractor';
import { Concept } from '../src/types';
// import * as mocha from 'mocha';
import * as assert from 'assert';

class Repository {
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

function formatKey(name: string, lang: string): string {
    return [lang, name].join('_');
}

describe('Extractor#extract', function () {
    const repository = new Repository();

    it('should find concepts', function () {
        const context = { lang: 'ro', text: 'De astăzi V. Filat cu Premierul Pavel Filip sunt colegi de cameră. Fondul Monetar International (FMI) s-a spart.' };

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
});
