
/** Utility function to create a K:V from a list of strings */
export function createEnum<T extends string>(o: Array<T>): {[K in T]: K} {
    return o.reduce((res, key) => {
        res[key] = key;
        return res;
    }, Object.create(null));
}

export function uniq<T>(items: T[]) {
    return items.filter((value, index, self) => self.indexOf(value) === index);
}
