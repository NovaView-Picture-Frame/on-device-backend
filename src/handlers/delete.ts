import fs from 'node:fs/promises';
import { z } from 'zod';
import type { RouterContext } from '@koa/router';

import { HttpBadRequestError } from '../middleware/errorHandler';
import { deleteByID } from '../repositories/images';
import ignoreErrorCodes from '../utils/ignoreErrorCodes';
import config from '../config';

const paramsSchema = z.object({
    id: z.coerce.number().int().positive(),
});

export default async (ctx: RouterContext) => {
    const paramsResult = paramsSchema.safeParse(ctx.params);
    if (!paramsResult.success) throw new HttpBadRequestError("Invalid URL parameters");

    const id = paramsResult.data.id;
    deleteByID(id) && await Promise.all(ignoreErrorCodes(
        [
            `${config.paths.originals._base}/${id}`,
            `${config.paths.cropped._base}/${id}`,
            `${config.paths.optimized._base}/${id}`
        ].map(fs.unlink),
        'ENOENT'
    ));

    ctx.body = {
        success: true
    };
}
