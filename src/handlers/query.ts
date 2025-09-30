import { getDeepResolvingFields, resolver, query, weave } from '@gqloom/core';
import { z } from 'zod';
import { ZodWeaver } from '@gqloom/zod';
import { createHandler } from 'graphql-http/lib/use/koa';
import type { ResolverPayload } from '@gqloom/core';

import { imageQuerySchema } from '../models/images/query';
import { querySingle, queryList } from '../repositories/images';

const parseFields = (payload: ResolverPayload) => {
    const fields = getDeepResolvingFields(payload);
    const root = fields.get('');
    if (!root) return null;
    return [ ...root.requestedFields ]
        .reduce<Record<string, string | string[]>>(
            (acc, key) => {
                const selected = fields.get(key)?.selectedFields;
                acc[key] = selected ? [ ...selected ] : 'include';
                return acc;
            },
            {}
        );
}

const queryResolver = resolver({
    image: query(imageQuerySchema.nullable())
        .input({ id: z.int().positive() })
        .resolve(({ id }, payload) => {
            if (!payload) return null;
            const selection = parseFields(payload);
            if (!selection) return null;

            return querySingle(id, selection);
        }),

    images: query(z.array(imageQuerySchema))
        .input({
            cursor: z.int().positive().optional(),
            size: z.int().positive().max(50).optional().default(50),
        })
        .resolve(({ size, cursor }, payload) => {
            if (!payload) return [];
            const selection = parseFields(payload);
            if (!selection) return [];

            return queryList(selection, size, cursor);
        }),
});

export default createHandler({
    schema: weave(ZodWeaver, queryResolver)
});
