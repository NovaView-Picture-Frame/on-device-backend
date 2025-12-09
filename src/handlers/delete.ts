import { z } from 'zod';
import type { RouterContext } from '@koa/router';

import { HttpBadRequestError } from '../middleware/errorHandler';
import { deleteProcessor } from '../services/images';

const paramsSchema = z.object({
    id: z.coerce.number().int().positive(),
});

export const deleteHandler = async (ctx: RouterContext) => {
    const paramsResult = paramsSchema.safeParse(ctx.params);
    if (!paramsResult.success) throw new HttpBadRequestError("Invalid URL parameters");

    await deleteProcessor(paramsResult.data.id);
    ctx.body = {
        success: true,
    };
}
