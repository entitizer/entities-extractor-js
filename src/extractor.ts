
const debug = require('debug')('entities-extractor');
import { Concept as ParserConcept, parse as parseConcepts } from 'concepts-parser';
import { Entity, Context, Repository, formatKeyFunc, Concept, ExtractorData } from './types';
import { ExtractorDataContainer } from './extractor-data-container';

export function extract<T extends Entity>(context: Context, repository: Repository<T>, formatKey: formatKeyFunc): Promise<ExtractorData<T>> {
    debug('start extracting...');
    let concepts: ParserConcept[];
    try {
        concepts = parseConcepts(context);
        debug('parsed concepts: ' + concepts.length);
    } catch (e) {
        return Promise.reject(e);
    }

    if (concepts.length === 0) {
        return
    }

    const container = new ExtractorDataContainer<T>(concepts.map(c => new Concept(c)), formatKey, context.lang);

    if (!concepts.length) {
        debug('Found no concepts!');
        return Promise.resolve(container.getData());
    }

    return getEntityIds(container.getKeys(), repository)
        .then(entityIds => {
            debug('got 1st entity ids');
            container.addEntityIds(entityIds);
            container.splitUnknownConcepts();

            const tasks = [];
            const splitUnknownConcepts = container.getSplittedUnknownConcepts();
            if (splitUnknownConcepts.length > 0) {
                tasks.push(getEntityIds(splitUnknownConcepts, repository).then(entityIds2 => container.addEntityIds(entityIds2)));
            }

            return Promise.all(tasks)
                .then(() => {
                    debug('got second entity ids');
                    const ids = container.getIds();
                    return repository.entitiesByIds(ids)
                        .then(entities => container.setEntities(entities))
                        .then(() => debug('got entities by ids'));
                })
                .then(() => container.getData());
        });
}

function getEntityIds<T extends Entity>(keys: string[], repository: Repository<T>) {
    return repository.entityIdsByKeys(keys);
}
