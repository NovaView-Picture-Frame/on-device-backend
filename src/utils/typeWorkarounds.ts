export const hasOwn = <
    T extends object,
    K extends PropertyKey
>(object: T, key: K): key is Extract<keyof T, K> =>
    Object.hasOwn(object, key);
