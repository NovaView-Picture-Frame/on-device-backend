import { resolver, query } from "@gqloom/core";
import { z } from "zod";
import { GraphQLError } from "graphql";

import { imageQuerySchema } from "../models/images";
import { querySingle, queryList, queryByIds } from "../../services/images"; 
import { parseSelection } from "../selection";
import { config } from "../../config";

export const imagesResolver = resolver({
    image: query(imageQuerySchema.nullable())
        .input({ id: z.int().positive() })
        .resolve(({ id }, payload) => {
            if (!payload) throw new GraphQLError("Unexpected error: payload is undefined.");

            return querySingle(id, parseSelection(payload));
        }),

    images: query(z.array(imageQuerySchema))
        .input({
            size: z
                .int()
                .positive()
                .max(config.services.query.page_size.max)
                .default(config.services.query.page_size.default),
            cursor: z.int().positive().optional(),
        })
        .resolve(({ size, cursor }, payload) => {
            if (!payload) throw new GraphQLError("Unexpected error: payload is undefined.");

            return queryList({ size, selection: parseSelection(payload), cursor: cursor ?? null });
        }),

    imagesByIds: query(z.array(imageQuerySchema.nullable()))
        .input({
            ids: z
                .array(z.int().positive())
                .min(1)
                .max(config.services.carousel.schedule_window_size.max_request),
        })
        .resolve(({ ids }, payload) => {
            if (!payload) throw new GraphQLError("Unexpected error: payload is undefined.");

            return queryByIds(ids, parseSelection(payload));
        })
});
