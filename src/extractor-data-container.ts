
const debug = require('debug')('entities-extractor');

import { Entity, Concept, formatKeyFunc, PlainObject } from './types';
import { uniq, arrayDiff } from './utils';
import { BaseDataContainer } from './base-data-container';

export class ExtractorDataContainer<T extends Entity> extends BaseDataContainer<T> {
    constructor(concepts: Concept[], formatKey: formatKeyFunc, lang: string) {
        super({ concepts: {}, ids: {}, entities: [], idKeys: {} }, formatKey, lang);
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
        Object.keys(entityIds).forEach(key => {
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
