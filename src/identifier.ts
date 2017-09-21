
import { ExtractorData, Entity } from './types';

export function identify<T extends Entity>(data: ExtractorData<T>): ExtractorData<T> {
    return data;
}
