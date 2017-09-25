
const debug = require('debug')('entitizer:extractor');

import { uniq } from '../utils';
import { PlainObject } from '../types';
import { DataContainer } from '../data-container';

export function addEntityIds(data: DataContainer, entityIds: PlainObject<string[]>) {
    if (!entityIds) {
        throw new Error(`invalid 'entityIds' argument`);
    }

    const keys = Object.keys(entityIds);

    keys.forEach(key => {
        const ids = entityIds[key];
        if (ids && ids.length) {
            data.getConceptsByKey(key).forEach(concept => {
                concept.entityIds = uniq((concept.entityIds || []).concat(ids));
                debug(`set concept(${concept.key})'s entityIds=${concept.entityIds}`);
            });
        } else {
            debug(`NO ids for key=${key}`);
        }
    });
}
