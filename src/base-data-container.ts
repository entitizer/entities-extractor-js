
// const debug = require('debug')('entities-extractor');

import { Entity, Concept, ExtractorData, formatKeyFunc } from './types';
import { uniq } from './utils';

export class BaseDataContainer<T extends Entity> {

    get lang() {
        return this.data.context.lang;
    }

    constructor(protected data: ExtractorData<T>, private formatKey: formatKeyFunc) {
        if (!context) {
            throw new Error(`Invalid 'context' argument`);
        }
        if (typeof formatKey !== 'function') {
            throw new Error(`Invalid 'formatKey' argument`);
        }
        data.keys = Object.keys(data.concepts);
    }

    protected setConceptKey(concept: Concept): string {
        let key = concept.get<string>('key');
        if (!key) {
            key = this.formatKey(concept.name || concept.value, this.lang);
            concept.set('key', key);
        }

        return key;
    }

    getData() {
        return this.data;
    }

    getConcepts(key: string): Concept[] {
        return this.data.concepts[key];
    }

    getKeys() {
        return this.data.keys;
    }

    getIds(): string[] {
        return uniq(Object.keys(this.data.ids).reduce<string[]>((list, key) => list.concat(this.data.ids[key]), []));
    }

    protected addConcept(concept: Concept) {
        const key = this.setConceptKey(concept);
        this.data.concepts[key] = this.data.concepts[key] || [];
        this.data.concepts[key].push(concept);

        this.data.keys = Object.keys(this.data.concepts);
    }
}