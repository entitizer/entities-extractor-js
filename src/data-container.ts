
const debug = require('debug')('entitizer:extractor');

import { Concept, formatKeyFunc, Context, PlainObject, Entity } from './types';
import { uniq } from './utils';

export class DataContainer {
    private conceptKeys: string[] = []
    private conceptsByKey: PlainObject<Concept[]> = {}
    private entities: Entity[]
    private entitiesById: PlainObject<Entity> = {}
    private entityIds: PlainObject<string[]> = {}

    constructor(private concepts: Concept[], private context: Context, private formatKey: formatKeyFunc) {
        if (!concepts) {
            throw new Error(`Invalid 'concepts' argument`);
        }
        if (!context) {
            throw new Error(`Invalid 'context' argument`);
        }
        if (typeof formatKey !== 'function') {
            throw new Error(`Invalid 'formatKey' argument`);
        }
        concepts.forEach(concept => {
            this.setConceptKey(concept);
            this.conceptKeys.push(concept.key);
            this.addConceptsByKey(concept);
        });

        this.conceptKeys = uniq(this.conceptKeys);

        debug(`created new DataContainer with keys=${this.conceptKeys}`);
    }

    //***** PUBLIC

    getLang() {
        return this.context.lang;
    }

    getConcepts() {
        return this.concepts;
    }

    getConceptsByKey(key: string): Concept[] {
        return this.conceptsByKey[key] || [];
    }

    getConceptKeys() {
        return this.conceptKeys;
    }

    getEntityIds(): string[] {
        return uniq(this.concepts.reduce<string[]>((list, concept) => list.concat(concept.entityIds || []), []));
    }

    getSplittedConceptsKeys() {
        return uniq(this.getSplittedConcepts().map(c => c.key));
    }

    getSplittedConcepts() {
        return this.concepts.filter(concept => !!concept.parent);
    }

    getUnknownConceptKeys() {
        return this.conceptKeys.filter(key => !this.conceptsByKey[key][0].entityIds || this.conceptsByKey[key][0].entityIds.length === 0);
    }

    getSplittedUnknownConceptKeys() {
        return this.getSplittedConceptsKeys().filter(key => !this.conceptsByKey[key][0].entityIds || this.conceptsByKey[key][0].entityIds.length === 0);
    }

    addConcepts(concepts: Concept[], parent?: Concept) {
        concepts.forEach(concept => this.addConcept(concept, parent));
    }

    addConcept(concept: Concept, parent?: Concept) {
        if (parent) {
            concept.parent = parent;
        }
        this.setConceptKey(concept);
        this.addConceptsByKey(concept);
        if (this.conceptKeys.indexOf(concept.key) < 0) {
            this.conceptKeys.push(concept.key);
        }

        if (parent) {
            concept.parent = parent;
            const parentIndex = this.concepts.findIndex(c => c === parent);
            // insert new concept after its parent
            this.concepts.splice(parentIndex, 0, concept);
        } else {
            this.concepts.push(concept);
        }

        if (this.entityIds[concept.key]) {
            concept.entityIds = this.entityIds[concept.key];
        }
    }

    formatConceptKey(name: string) {
        return this.formatKey(name, this.getLang());
    }

    addEntityIds(entityIds: PlainObject<string[]>) {
        if (!entityIds) {
            throw new Error(`invalid 'entityIds' argument`);
        }
        // debug('add entity ids=', entityIds);

        const keys = Object.keys(entityIds);

        keys.forEach(key => {
            const ids = entityIds[key];
            if (ids && ids.length) {
                this.getConceptsByKey(key).forEach(concept => {
                    concept.entityIds = uniq((concept.entityIds || []).concat(ids));
                    debug(`set concept(${concept.key})'s entityIds=${concept.entityIds}`);
                });
                this.entityIds[key] = uniq((this.entityIds[key] || []).concat(ids));
            } else {
                debug(`NO ids for key=${key}`);
            }
        });
    }

    setEntities(entities: Entity[]) {
        this.entities = entities;
        entities.forEach(entity => this.entitiesById[entity.id] = entity);
    }

    getEntity(id: string): Entity {
        return this.entitiesById[id];
    }

    //***** PROTECTED

    protected setConceptKey(concept: Concept): string {
        if (!concept.key) {
            concept.key = this.formatConceptKey(concept.nameOrValue);
        }

        return concept.key;
    }

    //***** PRIVATE

    private addConceptsByKey(concept: Concept) {
        this.conceptsByKey[concept.key] = this.conceptsByKey[concept.key] || [];
        this.conceptsByKey[concept.key].push(concept);
    }
}
