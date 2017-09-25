
// const debug = require('debug')('entitizer:extractor');

import { Concept } from '../types';
import { DataContainer } from '../data-container';

export function splitUnknownConcepts(data: DataContainer) {
    const keys = data.getUnknownConceptKeys();
    // let splittedConcepts: Concept[] = [];
    keys.forEach(key => {
        // if is unknown
        // if (!this.data.ids[key]) {
        data.getConceptsByKey(key).forEach(concept => {
            const splitted = concept.split(data.getLang());
            if (splitted && splitted.length) {
                data.addConcepts(splitted.map(c => new Concept(c)), concept);
            }
        });
        // }
    });
}
