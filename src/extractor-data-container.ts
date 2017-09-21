
const debug = require('debug')('entitizer:extractor');

import { Entity, Concept, formatKeyFunc, PlainObject, Context } from './types';
import { uniq, arrayDiff } from './utils';
import { BaseDataContainer } from './base-data-container';

export class ExtractorDataContainer<T extends Entity> extends BaseDataContainer<T> {
    constructor(concepts: Concept[], formatKey: formatKeyFunc, context: Context) {
        super({ concepts: {}, ids: {}, entities: [], idKeys: {}, context: context }, formatKey);
        concepts.forEach(concept => this.addConcept(concept));
    }

    setEntities(entities: T[]) {
        if (entities && entities.length) {
            this.data.entities = entities;
        }
    }

    addEntityIds(entityIds: PlainObject<string[]>) {
        if (!entityIds) {
            throw new Error(`invalid 'entityIds' argument`);
        }
        debug('add entity ids=', entityIds);

        const keys = Object.keys(entityIds);

        keys.forEach(key => {
            const ids = entityIds[key];
            if (ids && ids.length) {
                this.data.ids[key] = this.data.ids[key] || [];
                this.data.ids[key] = uniq(this.data.ids[key].concat(ids));
                ids.forEach(id => {
                    this.data.idKeys[id] = this.data.idKeys[id] || [];
                    this.data.idKeys[id].push(key);
                });
            }
        });

        return this.data.ids;
    }

    getIds(): string[] {
        this.replaceShortConcepts();
        return super.getIds();
    }

    private replaceShortConcepts() {
        const uniqueLongConceptsWithOneId = this.getKeys().map(key => this.getConcepts(key)[0])
            .filter(c => c.countWords > 1 && this.data.ids[c.key] && this.data.ids[c.key].length === 1)
            .sort((a, b) => b.countWords - a.countWords);

        uniqueLongConceptsWithOneId.forEach(longConceptWithOneId => {
            const conceptShortNames = formatShortNames(longConceptWithOneId);
            if (conceptShortNames.length) {
                const knownId = this.data.ids[longConceptWithOneId.key][0];
                conceptShortNames.forEach(sName => {
                    debug('replacing short name: ' + sName);
                    const sNameKey = this.formatKey(sName, this.lang);
                    // key exists
                    if (this.getConcepts(sNameKey)) {
                        const sNameKeyIds = this.data.ids[sNameKey];
                        this.data.ids[sNameKey] = [knownId];
                        if (sNameKeyIds) {
                            sNameKeyIds.forEach(id => {
                                const index = this.data.idKeys[id].indexOf(sNameKey);
                                if (index > -1) {
                                    // remove key for this id
                                    this.data.idKeys[id].splice(index, 1);
                                }
                                if (this.data.idKeys[id].length === 0) {
                                    delete this.data.idKeys[id];
                                }
                            });
                        }
                    }
                });
            }
        });
    }

    getUnknownConcepts(): string[] {
        return arrayDiff(this.getKeys(), Object.keys(this.data.ids));
    }

    getSplittedConcepts(): string[] {
        return this.getKeys().filter(key => !this.getConcepts(key)[0].parent);
    }

    getSplittedUnknownConcepts(): string[] {
        return arrayDiff(this.getSplittedConcepts(), Object.keys(this.data.ids));
    }

    splitUnknownConcepts() {
        const keys = this.getUnknownConcepts();
        // let splittedConcepts: Concept[] = [];
        keys.forEach(key => {
            // if is unknown
            if (!this.data.ids[key]) {
                this.getConcepts(key).forEach(concept => {
                    const splitted = concept.split(this.lang);
                    if (splitted && splitted.length) {
                        this.addSplittedConcepts(concept, splitted.map(c => new Concept(c)));
                    }
                });
            }
        });
    }

    protected addSplittedConcepts(parent: Concept, concepts: Concept[]) {
        concepts.forEach(concept => {
            concept.parent = parent;
            this.addConcept(concept);
        });
    }
}


function formatShortNames(concept: Concept): string[] {
    const names: string[] = concept.abbr ? [concept.abbr] : [];
    const name = concept.name || concept.value;

    // contains digits
    if (/\d/.test(name)) {
        return names;
    }
    const words = name.split(/[\s]+/g).filter(w => w && w[0] === w[0].toUpperCase());
    if (words.length < 2) {
        return names;
    }
    // create abbreviation
    if (!concept.abbr && words.length > 2) {
        const abbr = words.map(w => w[0]).join('');
        names.push(abbr);
    }

    // format sort names: Vlad Filat -> V. Filat, V.Filat, V Filat
    if (words.length === concept.countWords && words.length === 2) {
        // V. Filat
        names.push(words[0][0] + '. ' + words[1]);
        // V Filat
        names.push(words[0][0] + ' ' + words[1]);
        // V.Filat
        names.push(words[0][0] + '.' + words[1]);
    }

    return names;
}