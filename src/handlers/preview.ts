import fs from 'node:fs/promises';
import { z } from 'zod';
import type { RouterContext } from '@koa/router';

import { HttpBadRequestError, HttpNotFoundError } from '../middleware/errorHandler';
import { exists } from '../utils/repository';
import config from '../utils/config';

const paramsSchema = z.object({
    id: z.coerce.number().int().positive(),
});

export default async (ctx: RouterContext) => {
    const paramsResult = paramsSchema.safeParse(ctx.params);
    if (!paramsResult.success) throw new HttpBadRequestError("Invalid URL parameters");

    const id = paramsResult.data.id;
    if (!exists(id)) throw new HttpNotFoundError("Image not found");

    const handle = await fs.open(`${config.paths.optimized._base}/${id}`, 'r');
    const stats = await handle.stat();

    ctx.set('Content-Length', stats.size.toString());
    ctx.type = 'image/avif';
    ctx.body = handle.createReadStream();
}
