
import { Concept, ExtractResult, Entity, IdentifyResult, ConceptData } from './types';

export function identify<T extends Entity>(extractResult: ExtractResult<T>): IdentifyResult<T> {
    const result: IdentifyResult<T> = { concepts: extractResult.concepts.map(convertConceptData), entities: null };

    if (extractResult.entities) {
        result.entities = extractResult.entities.map(entityInfo => {
            return { entity: entityInfo.entity, concepts: entityInfo.concepts.map(convertConceptData) };
        });
    }

    return result;
}

function convertConceptData(c: Concept): ConceptData {
    const concept: ConceptData = { value: c.value, index: c.index };

    if (c.abbr) {
        concept.abbr = c.abbr;
    }
    if (c.name) {
        concept.name = c.name;
    }

    return concept;
}
