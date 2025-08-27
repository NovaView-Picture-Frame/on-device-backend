import fs from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import type { RouterContext } from '@koa/router';
import sharp from 'sharp';

import { BadRequestError, NotFoundError } from '../middleware/error';
import { getByID, updateOffset } from '../services/imageRepository';
import config from '../utils/config';
import ignoreErrorCode from '../utils/ignoreErrorCode';

const paramsSchema = z.object({
    id: z.coerce.number().int().positive(),
});

const bodySchema = z.object({
    extract_left_ratio: z.coerce.number().min(0).lt(1),
    extract_top_ratio: z.coerce.number().min(0).lt(1),
})
.strict()
.refine(
    ({ extract_left_ratio, extract_top_ratio }) =>
        (extract_left_ratio === 0 || extract_top_ratio === 0),
);

export default async (ctx: RouterContext) => {
    const paramsResult = paramsSchema.safeParse(ctx.params);
    if (!paramsResult.success) throw new BadRequestError("Invalid URL parameters");

    const bodyResult = bodySchema.safeParse(ctx.request.body);
    if (!bodyResult.success) throw new BadRequestError("Invalid request body");

    const record = getByID(paramsResult.data.id);
    if (!record) throw new NotFoundError("Image not found");

    const extract_left = Math.round(
        record.extract_width * bodyResult.data.extract_left_ratio
    );
    const extract_top = Math.round(
        record.extract_height * bodyResult.data.extract_top_ratio
    );
    
    if (
        extract_left === record.extract_left && extract_top === record.extract_top
    ) {
        ctx.body = { success: true };
        return;
    }

    if (
        extract_left + config.screen_width > record.extract_width ||
        extract_top + config.screen_height > record.extract_height
    ) throw new BadRequestError("Offset out of bounds");

    const hashHex = record.hash.toString('hex');
    const original = await fs.readFile(
        `${config.paths.originals._base}/${hashHex}`
    );
    const croppedTmp = `${config.paths.cropped._tmp}/${randomUUID()}`;

    try {
        await sharp(original)
            .resize(config.screen_width, config.screen_height, {
                fit: 'outside',
            })
            .extract({
                left: extract_left,
                top: extract_top,
                width: config.screen_width,
                height: config.screen_height,
            })
            .toFile(croppedTmp);

        await fs.rename(croppedTmp, `${config.paths.cropped._base}/${hashHex}`);

        const updated = updateOffset({
            id: paramsResult.data.id,
            extract_left,
            extract_top,
        });

        ctx.body = { success: updated };
    } finally {
        await ignoreErrorCode(fs.unlink(croppedTmp), 'ENOENT');
    };
}
