import { createReadStream } from 'node:fs';
import fs from 'node:fs/promises';
import { z } from 'zod';
import type { RouterContext } from '@koa/router';

import { HttpBadRequestError, HttpNotFoundError } from '../middleware/errorHandler';
import { getExtractRegionRecordByID } from '../repositories/images';
import { config } from '../config';

const paramsSchema = z.object({
    id: z.coerce.number().int().positive(),
});

export const previewHandler = async (ctx: RouterContext) => {
    const paramsResult = paramsSchema.safeParse(ctx.params);
    if (!paramsResult.success) throw new HttpBadRequestError("Invalid URL parameters");

    const extractRegionRecord = getExtractRegionRecordByID(paramsResult.data.id);
    if (!extractRegionRecord) throw new HttpNotFoundError("Image not found");

    const path = `${config.paths.optimized._base}/${extractRegionRecord.id}`;
    const stats = await fs.stat(path);

    ctx.set('Content-Length', stats.size.toString());
    ctx.type = 'image/avif';
    ctx.body = createReadStream(path);
}
