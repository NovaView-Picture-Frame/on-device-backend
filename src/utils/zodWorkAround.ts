import { z } from 'zod';

import { hasOwn } from './typeWorkarounds';

type ZodPartial<T> = Partial<{
    [P in keyof T]: T[P] | undefined
}>;

const stripUndefined = <T extends object>(
    source: ZodPartial<T>,
    target: Partial<T>,
    key: keyof T
) => {
    const value = source[key];
    if (value !== undefined) target[key] = value;
}

export const toTSPartial = <T extends z.ZodObject>(schema: T):
    z.ZodType<Partial<z.infer<T>>> =>
        schema.partial().transform(data => {
            const result = {};
            for (const key in data)
                hasOwn(data, key) && stripUndefined(data, result, key);

            return result;
        });
