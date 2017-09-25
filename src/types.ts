
import { Concept as ParserConcept, Context } from 'concepts-parser';
export { Context };

export class Concept extends ParserConcept {
    entityIds: string[]
    parent: Concept
    key: string

    constructor(concept: ParserConcept) {
        super(concept.toJSON());
    }

    get nameOrValue() {
        return this.name || this.value;
    }
}

export type PlainObject<T> = {
    [index: string]: T
}

export type AnyPlainObject = PlainObject<any>
export type StringPlainObject = PlainObject<string>

export interface Entity {
    id?: string
    name?: string
    cc2?: string
    type?: 'L' | 'H' | 'O' | 'P' | 'E' | 'C'
    data?: PlainObject<string[]>
    abbr?: string
    rank?: number
}

export interface Repository<T extends Entity> {
    entitiesByIds(ids: string[]): Promise<T[]>
    entityIdsByKeys(keys: string[]): Promise<PlainObject<string[]>>
}

export interface formatKeyFunc {
    (name: string, lang: string): string
}

export type ConceptData = {
    index: number
    value: string
    abbr?: string
    name?: string
}

export type EntityData<T extends Entity> = {
    entity: T
    concepts: ConceptData[]
}

export type ExtractorResult<T extends Entity> = {
    entities: EntityData<T>[]
    concepts: ConceptData[]
}
