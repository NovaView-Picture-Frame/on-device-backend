import fs from 'node:fs/promises';
import { z } from 'zod';
import type { RouterContext } from '@koa/router';

import { BadRequestError, NotFoundError } from '../middleware/error';
import { deleteByID } from '../services/imageRepository';
import ignoreErrorCode from '../utils/ignoreErrorCode';
import config from '../utils/config';

const paramsSchema = z.object({
    id: z.coerce.number().int().positive(),
});

export default async (ctx: RouterContext) => {
    const paramsResult = paramsSchema.safeParse(ctx.params);
    if (!paramsResult.success) throw new BadRequestError("Invalid URL parameters");

    const hash = deleteByID(paramsResult.data.id);
    if (!hash) throw new NotFoundError("Image not found");

    const hashHex = hash.toString('hex');
    await ignoreErrorCode([
        fs.unlink(`${config.paths.originals._base}/${hashHex}`),
        fs.unlink(`${config.paths.cropped._base}/${hashHex}`),
    ], 'ENOENT');

    ctx.body = { success: true };
}
