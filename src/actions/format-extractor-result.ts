
const debug = require('debug')('entitizer:extractor');

import { PlainObject, Entity, ExtractorResult, Concept, ConceptData, EntityData } from '../types';
import { DataContainer } from '../data-container';

export function formatExtractorResult<T extends Entity>(data: DataContainer): ExtractorResult<T> {
    const result: ExtractorResult<T> = { entities: [], concepts: [] };

    const entitiesMap: PlainObject<EntityData<T>> = {};

    data.getConcepts().forEach(concept => {
        if (concept.entityIds && concept.entityIds.length) {
            const id = concept.entityIds[0];
            let entityData: EntityData<T> = entitiesMap[id];
            if (!entityData) {
                entityData = { entity: <T>data.getEntity(id), concepts: [] };
                if (!entityData.entity) {
                    debug(`Not found entity '${id}'`);
                    return;
                    // throw new Error(`Not found entity '${id}'`);
                }
                entitiesMap[id] = entityData;
                result.entities.push(entityData);
            }
            entityData.concepts.push(convertConcept(concept));
        } else if (!concept.parent) {
            result.concepts.push(convertConcept(concept));
        }
    });

    return result;
}

function convertConcept(concept: Concept): ConceptData {
    const data: ConceptData = { value: concept.value, index: concept.index };

    if (concept.name) {
        data.name = concept.name;
    }

    if (concept.abbr) {
        data.abbr = concept.abbr;
    }

    return data;
}
