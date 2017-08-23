
const debug = require('debug')('entities-extractor');
import { Context, Concept, parse as parseConcepts, splitter } from 'concepts-parser';
import { PlainObject, uniq } from './utils';

export type Entity = {
    id: string
    name: string
    cc2?: string
    type: 'L' | 'H' | 'O' | 'P' | 'E' | 'C'
    data?: PlainObject<string[]>
    concepts?: ConceptData[]
}

export interface Repository {
    entitiesByIds(ids: string[]): Promise<Entity[]>
    entityIdsByKeys(keys: string[]): Promise<PlainObject<string[]>>
}

export interface formatKeyFunc {
    (name: string, lang: string): string
}

export function extract(context: Context, repository: Repository, formatKey: formatKeyFunc): Promise<ResultData> {
    debug('start extracting...');
    let concepts: Concept[];
    try {
        concepts = parseConcepts(context);
        debug('parsed concepts: ' + concepts.length);
    } catch (e) {
        return Promise.reject(e);
    }

    const result = new Result(context, formatKey);

    if (!concepts || !concepts.length) {
        debug('Found no concepts!');
        return Promise.resolve(result.getData());
    }

    result.setInitialConcepts(concepts);

    return getEntityIds(result.getInitialConceptsKeys(), repository)
        .then(entityIds => {
            result.pushEntityIds(entityIds);
            if (result.getUnknownCount() > 0) {
                result.getUnknownConcepts().forEach(concept => {
                    const splittedConcepts = concept.split(context.lang);
                    if (splittedConcepts && splittedConcepts.length) {
                        result.addSplittedConcepts(concept, splittedConcepts);
                    }
                });
            }
            const tasks = [];
            if (result.getSplittedUnknownCount() > 0) {
                tasks.push(getEntityIds(result.getSplittedUnknownKeys(), repository).then(entityIds2 => result.pushEntityIds(entityIds2)));
            }

            return Promise.all(tasks)
                .then(() => {
                    const ids = result.getIds();
                    return repository.entitiesByIds(ids)
                        .then(entities => result.setEntities(entities));
                })
                .then(() => result.getData());
        });
}

function getEntityIds(keys: string[], repository: Repository) {
    return repository.entityIdsByKeys(keys);
}

export type ConceptData = {
    index: number
    value: string
    name?: string
    abbr?: string
}

export type ResultData = {
    concepts: ConceptData[]
    entities: Entity[]
}

type ConceptsData = PlainObject<Concept[]>;

class Result {
    private data: ResultData = { concepts: [], entities: [] };
    private initialConcepts: Concept[] = [];
    private initialConceptsKeys: string[];
    private initialConceptsData: ConceptsData = {};
    private splittedConcepts: Concept[] = [];
    private splittedConceptsKeys: string[] = [];
    private splittedConceptsData: ConceptsData = {};
    private splittedUnknownConceptsKeys: string[] = [];
    private splittedUnknownConceptsData: ConceptsData = {};
    private allConcepts: Concept[] = [];
    // private allConceptsKeys: string[] = [];
    private allConceptsData: ConceptsData = {};
    private unknownConceptsKeys: string[] = [];
    private knownIds: PlainObject<string[]> = {};
    private knownKeys: string[] = [];
    private unknownConcepts: Concept[];
    private entities: Entity[];
    constructor(private context: { text: string, lang: string, country?: string }, private formatKey: formatKeyFunc) { }

    getData() {
        const data = this.data;
        const entities = this.entities;

        data.concepts = this.unknownConcepts.map(mapConceptData);

        if (!entities || !entities.length) {
            return data;
        }

        data.entities = entities;

        // const entityIdsMap = entities.reduce<PlainObject<Entity>>((r, entity) => {
        //     r[entity.id] = entity;
        //     return r;
        // }, {});

        return data;
    }

    setEntities(entities: Entity[]) {
        this.entities = entities;
    }

    pushEntityIds(entityIds: PlainObject<string[]>) {
        Object.keys(entityIds).forEach(key => {
            const ids = entityIds[key];
            this.knownIds[key] = this.knownIds[key] || [];
            this.knownIds[key] = uniq(this.knownIds[key].concat(ids));
        });
        this.knownKeys = Object.keys(this.knownIds);
        this.unknownConceptsKeys = Object.keys(this.allConceptsData).filter(key => this.knownKeys.indexOf(key) === -1);
        this.unknownConcepts = this.unknownConceptsKeys.reduce((list, key) => list.concat(this.allConceptsData[key]), []);
    }

    getIds() {
        const ids = uniq(Object.keys(this.knownIds).reduce<string[]>((list, key) => list.concat(this.knownIds[key]), []));
        return ids;
    }

    getUnknownKeys() {
        return this.unknownConceptsKeys;
    }

    getUnknownConcepts() {
        return this.unknownConcepts;
    }

    getUnknownCount() {
        return this.getUnknownKeys().length;
    }
    getSplittedUnknownKeys() {
        return this.splittedUnknownConceptsKeys;
    }
    getSplittedUnknownCount() {
        return this.splittedUnknownConceptsKeys.length;
    }

    setInitialConcepts(concepts: Concept[]) {
        this.initialConcepts = concepts;
        concepts.forEach(concept => {
            const key = setConceptKey(concept, this.formatKey, this.context.lang);
            this.initialConceptsData[key] = this.initialConceptsData[key] || [];
            this.initialConceptsData[key].push(concept);

            this.allConceptsData[key] = [].concat(this.initialConceptsData[key]);
        });
        this.initialConceptsKeys = Object.keys(this.initialConceptsData);

        this.allConcepts = [].concat(this.initialConcepts);
        // this.allConceptsKeys = [].concat(this.initialConceptsKeys);
    }

    getInitialConcepts() {
        return this.initialConcepts;
    }

    getInitialConceptsKeys() {
        return this.initialConceptsKeys;
    }

    getInitialConceptsData() {
        return this.initialConceptsData;
    }

    addSplittedConcepts(parent: Concept, concepts: Concept[]) {
        this.splittedConcepts = this.splittedConcepts.concat(concepts);
        concepts.forEach(concept => {
            concept.set('parent', parent);
            const key = setConceptKey(concept, this.formatKey, this.context.lang);
            this.splittedConceptsData[key] = this.splittedConceptsData[key] || [];
            this.splittedConceptsData[key].push(concept);

            this.allConceptsData[key] = this.allConceptsData[key] || [];
            this.allConceptsData[key].push(concept);
        });
        this.splittedConceptsKeys = Object.keys(this.splittedConceptsData);
        this.splittedUnknownConceptsKeys = uniq(this.unknownConcepts.filter(c => !!c.get('parent')).map(c => c.get<string>('key')));
    }

    getSplittedConceptsKeys() {
        return this.splittedConceptsKeys;
    }

    getConceptsByKey(key: string) {
        return this.allConceptsData[key];
    }
}

function mapConceptData(concept: Concept): ConceptData {
    const data: ConceptData = { index: concept.index, value: concept.value };
    if (concept.abbr) {
        data.abbr = concept.abbr;
    }
    if (concept.name) {
        data.name = concept.name;
    }

    return data;
}

function setConceptKey(concept: Concept, formatKey: formatKeyFunc, lang: string): string {
    let key = concept.get<string>('key');
    if (!key) {
        key = formatKey(concept.name || concept.value, lang);
        concept.set('key', key);
    }

    return key;
}
