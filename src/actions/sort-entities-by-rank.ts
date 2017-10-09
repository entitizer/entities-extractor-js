const debug = require('debug')('entitizer:extractor');

import { DataContainer } from '../data-container';

export function sortEntitiesByRank(data: DataContainer) {
    data.getConceptKeys().forEach(key => {
        const entityIds = data.getEntityIdsByKey(key);
        if (entityIds && entityIds.length > 1) {
            const entitiesIds = entityIds.map(id => data.getEntity(id)).sort((a, b) => b.rank - a.rank).map(e => e.id);
            if (entitiesIds[0] !== entityIds[0]) {
                debug(`Entity ${entitiesIds[0]} is most popular than ${entityIds[0]}`);
                data.setConceptEntityIds(key, entitiesIds);
            }
        }
    });
}
