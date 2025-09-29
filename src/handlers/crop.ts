import { z } from 'zod';
import type { RouterContext } from '@koa/router';

import { HttpBadRequestError, HttpNotFoundError } from '../middleware/errorHandler';
import { getExtractRegionRecordByID } from '../repositories/images';
import config from '../config'
import { cropProcessor } from '../services/crop';

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

const toOffset = (size: number, ratio: number, limit: number): number => {
    const offset = Math.floor(size * ratio);
    if (offset + limit > size) throw new HttpBadRequestError("Offset out of bounds");
    return offset;
};

export default (ctx: RouterContext) => {
    const paramsResult = paramsSchema.safeParse(ctx.params);
    if (!paramsResult.success) throw new HttpBadRequestError("Invalid URL parameters");

    const bodyResult = bodySchema.safeParse(ctx.request.body);
    if (!bodyResult.success) throw new HttpBadRequestError("Invalid request body");

    const extractRegionRecord = getExtractRegionRecordByID(paramsResult.data.id);
    if (!extractRegionRecord) throw new HttpNotFoundError("Image not found");

    const left = toOffset(
        extractRegionRecord.extractRegion.width,
        bodyResult.data.extract_left_ratio,
        config.screenWidth
    );

    const top = toOffset(
        extractRegionRecord.extractRegion.height,
        bodyResult.data.extract_top_ratio,
        config.screenHeight
    );

    if (
        left === extractRegionRecord.extractRegion.left &&
        top === extractRegionRecord.extractRegion.top
    ) {
        ctx.body = {
            data: {
                type: "unchanged",
            }
        };

        return;
    }

    const taskId = cropProcessor({
        id: extractRegionRecord.id,
        left,
        top,
    });

    ctx.body = {
        data: {
            type: "processing",
            taskId,
        },
    }
}
