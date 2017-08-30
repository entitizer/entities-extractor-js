
const debug = require('debug')('entities-extractor');
import { Concept, parse as parseConcepts } from 'concepts-parser';
import { Entity, Context, Repository, formatKeyFunc, IdentifyResult } from './types';
import { ExtractorContainer } from './extractor-container';
import { identify } from './identifier';

export function extract<T extends Entity>(context: Context, repository: Repository<T>, formatKey: formatKeyFunc): Promise<IdentifyResult<T>> {
    debug('start extracting...');
    let concepts: Concept[];
    try {
        concepts = parseConcepts(context);
        debug('parsed concepts: ' + concepts.length);
    } catch (e) {
        return Promise.reject(e);
    }

    const container = new ExtractorContainer<T>(context.lang, formatKey);

    if (!concepts || !concepts.length) {
        debug('Found no concepts!');
        return Promise.resolve(identify(container.getResult()));
    }

    container.setRootConcepts(concepts);

    return getEntityIds(container.getRootConcepts().keys, repository)
        .then(entityIds => {
            debug('got 1st entity ids');
            container.addEntityIds(entityIds);
            const rootUnknownConcepts = container.getRootUnknownConcepts();
            if (rootUnknownConcepts.list.length > 0) {
                rootUnknownConcepts.list.forEach(concept => {
                    const splittedConcepts = concept.split(context.lang);
                    if (splittedConcepts && splittedConcepts.length) {
                        container.addSplittedConcepts(concept, splittedConcepts);
                    }
                });
            }
            const tasks = [];
            const splitUnknownConcepts = container.getSplittedUnknownConcepts();
            if (splitUnknownConcepts.list.length > 0) {
                tasks.push(getEntityIds(splitUnknownConcepts.keys, repository).then(entityIds2 => container.addEntityIds(entityIds2)));
            }

            return Promise.all(tasks)
                .then(() => {
                    debug('got second entity ids');
                    const ids = container.getIds();
                    return repository.entitiesByIds(ids)
                        .then(entities => container.setEntities(entities))
                        .then(() => debug('got entities by ids'));
                })
                .then(() => container.getResult())
                .then(identify);
        });
}

function getEntityIds<T extends Entity>(keys: string[], repository: Repository<T>) {
    return repository.entityIdsByKeys(keys);
}
