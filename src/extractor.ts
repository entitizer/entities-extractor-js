
const debug = require('debug')('entitizer:extractor');

import { Concept as ParserConcept, parse as parseConcepts } from 'concepts-parser';
import { Entity, Context, Repository, formatKeyFunc, Concept, ExtractorResult } from './types';
import { DataContainer } from './data-container';
import { replaceShortConcepts, splitUnknownConcepts, formatExtractorResult } from './actions';

export function extract<T extends Entity>(context: Context, repository: Repository<T>, formatKey: formatKeyFunc): Promise<ExtractorResult<T>> {
    debug('start extracting...');
    let concepts: ParserConcept[];
    try {
        concepts = parseConcepts(context);
        debug('parsed concepts: ' + concepts.length);
    } catch (e) {
        return Promise.reject(e);
    }

    const emptyResult: ExtractorResult<T> = { concepts: [], entities: [] };

    if (concepts.length === 0) {
        return Promise.resolve(emptyResult);
    }

    const container = new DataContainer(concepts.map(c => new Concept(c)), context, formatKey);

    if (!concepts.length) {
        debug('Found no concepts!');
        return Promise.resolve(emptyResult);
    }

    return getEntityIds(container.getConceptKeys(), repository)
        .then(entityIds => {
            debug('got 1st entity ids');
            container.addEntityIds(entityIds);
            splitUnknownConcepts(container);
            replaceShortConcepts(container);

            const tasks = [];
            const splitUnknownConceptKeys = container.getSplittedConceptsKeys();
            if (splitUnknownConceptKeys.length > 0) {
                tasks.push(getEntityIds(splitUnknownConceptKeys, repository).then(entityIds2 => container.addEntityIds(entityIds2)));
            }

            return Promise.all(tasks)
                .then(() => {
                    debug('got second entity ids');
                    const ids = container.getEntityIds();
                    if (ids.length) {
                        return repository.entitiesByIds(ids)
                            .then(entities => container.setEntities(entities))
                            .then(() => debug('got entities by ids'));
                    }
                });
        })
        .then(() => formatExtractorResult<T>(container));
}

function getEntityIds<T extends Entity>(keys: string[], repository: Repository<T>) {
    return repository.entityIdsByKeys(keys);
}
