
import { Concept, Context } from 'concepts-parser';

export { Context, Concept };

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
}

export type ExtractResult<T extends Entity> = {
    concepts: Concept[]
    entities: { entity: T, concepts: Concept[] }[]
}

export type ConceptData = {
    index: number
    value: string
    abbr?: string
    name?: string
}

export type IdentifyResult<T extends Entity> = {
    concepts: ConceptData[]
    entities: { entity: T, concepts: ConceptData[] }[]
}

export interface Repository<T extends Entity> {
    entitiesByIds(ids: string[]): Promise<T[]>
    entityIdsByKeys(keys: string[]): Promise<PlainObject<string[]>>
}

export interface formatKeyFunc {
    (name: string, lang: string): string
}
