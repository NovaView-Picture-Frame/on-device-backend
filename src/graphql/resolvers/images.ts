import { resolver, query } from "@gqloom/core";
import { z } from "zod";
import { GraphQLError } from "graphql";

import { imageQuerySchema } from "../models/images";
import { querySingle, queryList } from "../../repositories/images";
import { parseSelection } from "../selection";
import { appConfig } from "../../config";

export const imagesResolver = resolver({
    image: query(imageQuerySchema.nullable())
        .input({ id: z.int().positive() })
        .resolve(({ id }, payload) => {
            if (!payload) throw new GraphQLError("Unexpected error: payload is undefined.");

            return querySingle(id, parseSelection(payload));
        }),

    images: query(z.array(imageQuerySchema))
        .input({
            cursor: z.int().positive().optional(),
            size: z
                .int()
                .positive()
                .max(appConfig.services.query.max_page_size)
                .default(appConfig.services.query.default_page_size),
        })
        .resolve(({ size, cursor }, payload) => {
            if (!payload) throw new GraphQLError("Unexpected error: payload is undefined.");

            return queryList({ size, selection: parseSelection(payload), cursor: cursor ?? null });
        }),
});
