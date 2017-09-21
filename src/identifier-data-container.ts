
const debug = require('debug')('entities-extractor');

import { Entity, Concept, ExtractorData, formatKeyFunc } from './types';
import { uniq } from './utils';
import { BaseDataContainer } from './base-data-container';

export class IdentifierDataContainer<T extends Entity> extends BaseDataContainer<T> {

}