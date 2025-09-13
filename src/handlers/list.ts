import { z } from 'zod';
import type { RouterContext } from '@koa/router';

import { HttpBadRequestError } from '../middleware/errorHandler';
import { list } from '../repositories/images';

const querySchema = z.object({
    cursor: z.coerce.number().int().positive().optional(),
    size: z.coerce.number().int().positive().max(50).optional().default(10),
}).strict();

export default (ctx: RouterContext) => {
    const queryResult = querySchema.safeParse(ctx.query);
    if (!queryResult.success) throw new HttpBadRequestError("Invalid query parameters");

    const records = list({
        cursor: queryResult.data.cursor ?? null,
        size: queryResult.data.size
    });

    ctx.body = {
        data: { records },
    };
}
