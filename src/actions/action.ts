
const debug = require('debug')('entitizer:extractor');

import { DataContainer } from '../data-container';
import { uniq } from '../utils';

export abstract class Action<R, P> {
    constructor(protected data: DataContainer, protected params?: P) { }

    execute(): R {
        return this.innerExecute();
    }

    getData() {
        return this.data;
    }

    protected abstract innerExecute(): R

    protected debug(...params: any[]) {
        debug.apply(debug, params);
    }

    protected uniq<T>(arr: T[]): T[] {
        return uniq(arr);
    }
}
