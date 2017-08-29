
const debug = require('debug')('entities-extractor');
import { Concept, parse as parseConcepts } from 'concepts-parser';
import { Entity, Context, Repository, formatKeyFunc, IdentifyResult } from './types';
import { ExtractorInner } from './extractor-inner';
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

    const result = new ExtractorInner<T>(context, formatKey);

    if (!concepts || !concepts.length) {
        debug('Found no concepts!');
        return Promise.resolve(identify(result.getData()));
    }

    result.setInitialConcepts(concepts);

    return getEntityIds(result.getInitialConcepts().keys, repository)
        .then(entityIds => {
            result.addEntityIds(entityIds);
            if (result.getUnknownCount() > 0) {
                result.getUnknownConcepts().list.forEach(concept => {
                    const splittedConcepts = concept.split(context.lang);
                    if (splittedConcepts && splittedConcepts.length) {
                        result.addSplittedConcepts(concept, splittedConcepts);
                    }
                });
            }
            const tasks = [];
            if (result.getSplittedUnknownCount() > 0) {
                tasks.push(getEntityIds(result.getSplittedUnknownKeys(), repository).then(entityIds2 => result.addEntityIds(entityIds2)));
            }

            return Promise.all(tasks)
                .then(() => {
                    const ids = result.getIds();
                    return repository.entitiesByIds(ids)
                        .then(entities => result.setEntities(entities));
                })
                .then(() => result.getData())
                .then(identify);
        });
}

function getEntityIds<T extends Entity>(keys: string[], repository: Repository<T>) {
    return repository.entityIdsByKeys(keys);
}
