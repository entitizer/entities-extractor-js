const debug = require('debug')('entitizer:extractor');

import { DataContainer } from '../data-container';

export function sortEntitiesByRank(data: DataContainer) {
    data.getConcepts().forEach(concept => {
        if (concept.entityIds && concept.entityIds.length > 1) {
            const entitiesIds = concept.entityIds.map(id => data.getEntity(id)).sort((a, b) => b.rank - a.rank).map(e => e.id);
            if (entitiesIds[0] !== concept.entityIds[0]) {
                debug(`Entity ${entitiesIds[0]} is most popular than ${concept.entityIds[0]}`);
                concept.entityIds = entitiesIds;
            }
        }
    });
}
