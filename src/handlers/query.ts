import { getDeepResolvingFields, resolver, query, weave } from '@gqloom/core';
import { z } from 'zod';
import { createHandler } from 'graphql-http/lib/use/koa';
import { ZodWeaver } from '@gqloom/zod';
import { GraphQLError } from 'graphql';
import type { ResolverPayload } from '@gqloom/core';

import { selectionSchema, imageQuerySchema } from '../models/images/query';
import { querySingle, queryList } from '../repositories/images';

const isValidField = (field: string) => !field.startsWith('__');

const parseFields = (payload: ResolverPayload) => {
    const fieldsRaw = getDeepResolvingFields(payload);

    const root = fieldsRaw.get('');
    if (!root) return null;

    const validFields = Array.from(root.requestedFields).filter(isValidField);
    if (validFields.length === 0) return null;

    const fields = Object.fromEntries(
        validFields
            .map(key => {
                const selectedFields = fieldsRaw.get(key)?.selectedFields;

                return [
                    key,
                    selectedFields
                        ? Array.from(selectedFields).filter(isValidField)
                        : 'include',
                ];
            })
    );

    const fieldsResult = selectionSchema.safeParse(fields);
    if (!fieldsResult.success) throw new GraphQLError("Invalid selection");
    return fieldsResult.data;
}

const queryResolver = resolver({
    image: query(imageQuerySchema.nullable())
        .input({ id: z.int().positive() })
        .resolve(({ id }, payload) => {
            if (!payload) return null;
            const selection = parseFields(payload);
            if (!selection) return {};

            return querySingle(id, selection);
        }),

    images: query(z.array(imageQuerySchema))
        .input({
            cursor: z.int().positive().optional(),
            size: z.int().positive().max(50).default(50),
        })
        .resolve(({ size, cursor }, payload) => {
            if (!payload) return [];
            const selection = parseFields(payload);
            if (!selection) return [{}];

            return queryList(size, selection, cursor);
        }),
});

export default createHandler({
    schema: weave(ZodWeaver, queryResolver)
});
