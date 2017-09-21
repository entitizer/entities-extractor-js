
const debug = require('debug')('entities-extractor');
import { uniq, arrayDiff } from './utils';
import { PlainObject, Entity, formatKeyFunc, Concept, ExtractResult } from './types';

type DataContainer<T> = {
    list: T[]
    keys: string[]
    map: PlainObject<T[]>
}

export class ExtractorContainer<T extends Entity> {
    private rootConcepts: DataContainer<Concept> = { list: [], keys: [], map: {} };
    private splittedConcepts: DataContainer<Concept> = { list: [], keys: [], map: {} };
    private allConcepts: DataContainer<Concept> = { list: [], keys: [], map: {} };
    private entityIds: PlainObject<string[]> = {};
    private result: ExtractResult<T> = { entities: [], concepts: [] };
    // private extractorData: ExtractorData<T> = { concepts: {}, ids: {} }

    constructor(private lang: string, private formatKey: formatKeyFunc) {
        if (typeof lang !== 'string') {
            throw new Error(`Invalid 'lang' argument`);
        }
        if (typeof formatKey !== 'function') {
            throw new Error(`Invalid 'formatKey' argument`);
        }
    }

    private setResultConcepts() {
        const keys = Object.keys(this.entityIds);
        const diffKeys = arrayDiff(this.rootConcepts.keys, keys);
        debug('root keys', this.rootConcepts.keys);
        debug('entityIds keys', keys);
        debug('diff keys', diffKeys);
        this.result.concepts = diffKeys.reduce<Concept[]>((list, key) => list.concat(this.getConceptsByKey(key)), []);
    }

    getResult(): ExtractResult<T> {
        this.setResultConcepts();
        return this.result;
    }

    setEntities(entities: T[]) {
        if (!entities) {
            throw new Error(`invalid 'entities' argument`);
        }
        const keys = Object.keys(this.entityIds);
        const entityConceptMap: PlainObject<Concept[]> = entities.reduce<PlainObject<Concept[]>>((result, entity) => {
            result[entity.id] = result[entity.id] || [];
            keys.forEach(key => {
                if (~this.entityIds[key].indexOf(entity.id)) {
                    result[entity.id] = result[entity.id].concat(this.getConceptsByKey(key));
                }
            });
            return result;
        }, {});

        this.result.entities = entities.map(entity => { return { entity: entity, concepts: entityConceptMap[entity.id] }; });
    }

    addEntityIds(entityIds: PlainObject<string[]>) {
        if (!entityIds) {
            throw new Error(`invalid 'entityIds' argument`);
        }
        debug('add entity ids=', entityIds);
        Object.keys(entityIds).forEach(key => {
            const ids = entityIds[key];
            if (ids && ids.length) {
                this.entityIds[key] = this.entityIds[key] || [];
                this.entityIds[key] = uniq(this.entityIds[key].concat(ids));
            }
        });

        return this.entityIds;
    }

    getIds() {
        const keys = Object.keys(this.entityIds);
        // const keysByAbbr: PlainObject<string[]> = {};
        // const uniqueKeys = keys.filter(key => {
        //     const concepts = this.getConceptsByKey(key);
        //     const conceptWithAbbr = concepts.find(concept => !!concept.abbr);
        //     if (conceptWithAbbr) {
        //         keysByAbbr[conceptWithAbbr.abbr] = keysByAbbr[conceptWithAbbr.abbr] || [];
        //         keysByAbbr[conceptWithAbbr.abbr].push(key);
        //     }
        //     return this.entityIds[key].length === 1;
        // });
        // const uniqueKeysIsNotAbbr = uniqueKeys.filter(key => !this.getConceptsByKey(key)[0].isAbbr);

        // keys.forEach(key => {
        //     const ids = this.entityIds[key];
        //     const concepts = this.getConceptsByKey(key);
        //     if (concepts[0].isAbbr) {
        //         const abbrKeys = keysByAbbr[concepts[0].value];
        //         if (abbrKeys && abbrKeys.length) {
        //             for (let i = 0; i < abbrKeys.length; i++) {
        //                 const aKey = abbrKeys[i];
        //                 if (~uniqueKeys.indexOf(aKey)) {

        //                 }
        //             }
        //         }
        //     }
        // });

        return uniq(keys.reduce<string[]>((list, key) => list.concat(this.entityIds[key]), []));
    }

    getRootUnknownConcepts() {
        const keys = arrayDiff(this.rootConcepts.keys, Object.keys(this.entityIds));
        return buildConceptsContainer(keys, this.rootConcepts);
    }

    getSplittedUnknownConcepts() {
        const keys = arrayDiff(this.splittedConcepts.keys, Object.keys(this.entityIds));
        debug('splitted diff', keys);
        return buildConceptsContainer(keys, this.splittedConcepts);
    }

    setRootConcepts(concepts: Concept[]) {
        if (!concepts) {
            throw new Error(`invalid 'concepts' argument`);
        }
        this.rootConcepts.list = concepts;

        concepts.forEach(concept => {
            const key = setConceptKey(concept, this.formatKey, this.lang);

            this.rootConcepts.map[key] = this.rootConcepts.map[key] || [];
            this.rootConcepts.map[key].push(concept);

            this.allConcepts.map[key] = this.allConcepts.map[key] || [];
            this.allConcepts.map[key].push(concept);
        });

        this.rootConcepts.keys = Object.keys(this.rootConcepts.map);
        this.allConcepts.keys = [].concat(this.rootConcepts.keys);
        this.allConcepts.list = [].concat(this.rootConcepts.list);
    }

    getRootConcepts() {
        return this.rootConcepts;
    }

    addSplittedConcepts(parent: Concept, concepts: Concept[]) {
        if (!parent) {
            throw new Error(`invalid 'parent' argument`);
        }
        if (!concepts) {
            throw new Error(`invalid 'concepts' argument`);
        }
        this.splittedConcepts.list = this.splittedConcepts.list.concat(concepts);
        this.allConcepts.list = this.allConcepts.list.concat(concepts);

        concepts.forEach(concept => {
            concept.set('parent', parent);
            const key = setConceptKey(concept, this.formatKey, this.lang);

            this.splittedConcepts.map[key] = this.splittedConcepts.map[key] || [];
            this.splittedConcepts.map[key].push(concept);

            this.allConcepts.map[key] = this.allConcepts.map[key] || [];
            this.allConcepts.map[key].push(concept);
        });
        this.splittedConcepts.keys = Object.keys(this.splittedConcepts.map);
        this.allConcepts.keys = Object.keys(this.allConcepts.map);
    }

    getSplittedConcepts() {
        return this.splittedConcepts;
    }

    getAllConcepts() {
        return this.allConcepts;
    }

    getConceptsByKey(key: string) {
        return this.allConcepts.map[key];
    }
}

function buildConceptsContainer(keys: string[], parent: DataContainer<Concept>) {
    const container: DataContainer<Concept> = {
        keys: keys,
        list: [],
        map: {}
    };

    container.keys.forEach(key => {
        container.map[key] = parent.map[key];
        container.list = container.list.concat(container.map[key]);
    });

    return container;
}

function setConceptKey(concept: Concept, formatKey: formatKeyFunc, lang: string): string {
    let key = concept.get<string>('key');
    if (!key) {
        key = formatKey(concept.name || concept.value, lang);
        concept.set('key', key);
    }

    return key;
}
