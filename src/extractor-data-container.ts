
const debug = require('debug')('entities-extractor');

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

        this.replaceKnownAbbreviations();
        // replace short concepts with longer...

        return super.getIds();
    }

    private replaceKnownAbbreviations() {
        const abbrKeys = this.getAbbrKeys();
        if (Object.keys(abbrKeys).length) {
            Object.keys(this.data.ids).forEach(key => {
                const ids = this.data.ids[key];
                if (ids && ids.length) {
                    const concepts = this.getConcepts(key);
                    if (concepts[0].isAbbr && abbrKeys[concepts[0].value]) {
                        const abbrKey = abbrKeys[concepts[0].value];
                        if (this.data.ids[abbrKey].length === 1) {
                            const conceptWithAbbrId = this.data.ids[abbrKey][0];
                            // const oldIds = this.data.ids[key];
                            this.data.ids[key] = [conceptWithAbbrId];
                            this.data.idKeys[conceptWithAbbrId].push(key);
                            ids.forEach(id => {
                                const index = this.data.idKeys[id].indexOf(key);
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
                }
            });
        }
    }

    private getAbbrKeys(): PlainObject<string> {
        return this.getKeys().reduce<PlainObject<string>>((data, key) => {
            const c = this.getConcepts(key).find(c => !!c.abbr);
            if (c && !data[c.abbr]) {
                data[c.abbr] = key;
            }
            return data;
        }, {});
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
