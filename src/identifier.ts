
import { ExtractorData, Entity, formatKeyFunc } from './types';
import { IdentifierDataContainer } from './identifier-data-container';

export function identify<T extends Entity>(data: ExtractorData<T>, formatKey: formatKeyFunc): ExtractorData<T> {
    const container = new IdentifierDataContainer<T>(data, formatKey);
    return data;
}
