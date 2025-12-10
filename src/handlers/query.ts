import {
    getDeepResolvingFields,
    resolver,
    query,
    weave,
} from '@gqloom/core';
import { z } from 'zod';
import { createHandler } from 'graphql-http/lib/use/koa';
import { ZodWeaver } from '@gqloom/zod';
import { GraphQLError } from 'graphql';
import type { ResolverPayload } from '@gqloom/core';

import { imageQuerySchema, type Selection } from '../models/images';
import { config } from '../config';
import { querySingle, queryList } from '../repositories/images';

const parseSelection = (payload: ResolverPayload): Selection => {
    const rootMap = getDeepResolvingFields(payload);

    const rootSet = rootMap.get('')?.requestedFields;
    if (!rootSet) throw new Error(
        "Unexpected error: rootSet does not exist."
    );

    return Object.fromEntries(
        Array.from(rootSet, field => {
            const childSet = rootMap.get(field)?.requestedFields;

            return [
                field,
                childSet
                    ? Array.from(childSet)
                    : 'include',
            ]
        })
    );
}

const queryResolver = resolver({
    image: query(imageQuerySchema.nullable())
        .input({ id: z.int().positive() })
        .resolve(({ id }, payload) => {
            if (!payload) throw new GraphQLError(
                "Unexpected error: payload is undefined."
            );

            return querySingle(id, parseSelection(payload));
        }),

    images: query(z.array(imageQuerySchema))
        .input({
            cursor: z.int().positive().optional(),
            size: z
                .int()
                .positive()
                .max(config.queryMaxPageSize)
                .default(config.queryDefaultPageSize),
        })
        .resolve(({ size, cursor }, payload) => {
            if (!payload) throw new GraphQLError(
                "Unexpected error: payload is undefined."
            );

            return queryList({
                size,
                selection: parseSelection(payload),
                cursor: cursor ?? null,
            });
        }),
});

export const queryHandler = createHandler({
    schema: weave(ZodWeaver, queryResolver)
});
