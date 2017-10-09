
const debug = require('debug')('entitizer:extractor');

import { DataContainer } from '../data-container';
import { formatShortNames } from '../helpers';

export function replaceShortConcepts(data: DataContainer) {
    const uniqueLongConcepts = data.getConcepts()
        .filter(c => c.countWords > 1 && c.entityIds && c.entityIds.length === 1)
        .sort((a, b) => b.countWords - a.countWords);

    uniqueLongConcepts.forEach(longConcept => {
        const conceptShortNames = formatShortNames(longConcept);
        if (conceptShortNames.length) {
            const uniqueEntityId = longConcept.entityIds[0];
            conceptShortNames.forEach(sName => {
                debug(`replacing short name: ${sName}`);
                const sNameKey = data.formatConceptKey(sName);
                debug(`Replace short concept entity ids: ${sNameKey} with [${uniqueEntityId}]`);
                data.setConceptEntityIds(sNameKey, [uniqueEntityId]);
            });
        }
    });
}
