
import { uniq } from './utils';
import { PlainObject, Entity, formatKeyFunc, Concept, ExtractResult } from './types';

type DataContainer<T> = {
    list: T[]
    keys: string[]
    map: PlainObject<T[]>
}

export class ExtractorInner<T extends Entity> {
    private initialConcepts: DataContainer<Concept>;
    private splittedConcepts: DataContainer<Concept>;
    private splittedUnknownConceptsKeys: string[] = [];
    private allConcepts: DataContainer<Concept>;
    private entityIds: PlainObject<string[]> = {};
    private knownKeys: string[] = [];
    private unknownConcepts: DataContainer<Concept>;
    private entities: T[];

    constructor(private context: { text: string, lang: string, country?: string }, private formatKey: formatKeyFunc) { }

    getData(): ExtractResult<T> {
        if (!this.entities) {
            return { entities: [], concepts: this.unknownConcepts.list }
        }

        const entityConceptMap: PlainObject<Concept[]> = this.entities.reduce<PlainObject<Concept[]>>((result, entity) => {
            result[entity.id] = result[entity.id] || [];
            Object.keys(this.entityIds).forEach(key => {
                if (~this.entityIds[key].indexOf(entity.id)) {
                    result[entity.id] = result[entity.id].concat(this.getConceptsByKey(key));
                }
            });
            return result;
        }, {});
        
        const data: ExtractResult<T> = {
            entities: this.entities.map(entity => { return { entity: entity, concepts: entityConceptMap[entity.id] }; }),
            concepts: this.unknownConcepts.list
        };

        return data;
    }

    setEntities(entities: T[]) {
        this.entities = entities;
    }

    addEntityIds(entityIds: PlainObject<string[]>) {
        this.unknownConcepts = this.unknownConcepts || { keys: [], list: [], map: {} };
        Object.keys(entityIds).forEach(key => {
            const ids = entityIds[key];
            this.entityIds[key] = this.entityIds[key] || [];
            this.entityIds[key] = uniq(this.entityIds[key].concat(ids));
        });
        this.knownKeys = Object.keys(this.entityIds);
        this.unknownConcepts.keys = this.allConcepts.keys.filter(key => this.knownKeys.indexOf(key) === -1);
        this.unknownConcepts.list = this.unknownConcepts.keys.reduce((list, key) => list.concat(this.allConcepts.map[key]), []);
    }

    getIds() {
        const ids = uniq(Object.keys(this.entityIds).reduce<string[]>((list, key) => list.concat(this.entityIds[key]), []));
        return ids;
    }

    getUnknownConcepts() {
        return this.unknownConcepts;
    }

    getUnknownCount() {
        return this.getUnknownConcepts().keys.length;
    }
    getSplittedUnknownKeys() {
        return this.splittedUnknownConceptsKeys;
    }
    getSplittedUnknownCount() {
        return this.splittedUnknownConceptsKeys.length;
    }

    setInitialConcepts(concepts: Concept[]) {
        this.initialConcepts = { list: concepts, keys: [], map: {} };
        this.allConcepts = { list: [].concat(this.initialConcepts.list), keys: [], map: {} };

        concepts.forEach(concept => {
            const key = setConceptKey(concept, this.formatKey, this.context.lang);
            this.initialConcepts.map[key] = this.initialConcepts.map[key] || [];
            this.initialConcepts.map[key].push(concept);

            this.allConcepts.map[key] = [].concat(this.initialConcepts.map[key]);
        });

        this.initialConcepts.keys = Object.keys(this.initialConcepts.map);
        this.allConcepts.keys = [].concat(this.initialConcepts.keys);
    }

    getInitialConcepts() {
        return this.initialConcepts;
    }

    addSplittedConcepts(parent: Concept, concepts: Concept[]) {
        this.splittedConcepts = this.splittedConcepts || { keys: [], list: [], map: {} };
        this.splittedConcepts.list = this.splittedConcepts.list.concat(concepts);
        this.allConcepts.list = this.allConcepts.list.concat(concepts);

        concepts.forEach(concept => {
            concept.set('parent', parent);
            const key = setConceptKey(concept, this.formatKey, this.context.lang);
            this.splittedConcepts.map[key] = this.splittedConcepts.map[key] || [];
            this.splittedConcepts.map[key].push(concept);

            this.allConcepts.map[key] = this.allConcepts.map[key] || [];
            this.allConcepts.map[key].push(concept);
        });
        this.splittedConcepts.keys = Object.keys(this.splittedConcepts.map);
        this.allConcepts.keys = Object.keys(this.allConcepts.map);

        this.splittedUnknownConceptsKeys = uniq(this.unknownConcepts.list.filter(c => !!c.get('parent')).map(c => c.get<string>('key')));
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

function setConceptKey(concept: Concept, formatKey: formatKeyFunc, lang: string): string {
    let key = concept.get<string>('key');
    if (!key) {
        key = formatKey(concept.name || concept.value, lang);
        concept.set('key', key);
    }

    return key;
}
