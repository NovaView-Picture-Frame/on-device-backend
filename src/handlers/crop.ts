import { z } from 'zod';
import type { RouterContext } from '@koa/router';

import { HttpBadRequestError, HttpNotFoundError } from '../middleware/errorHandler';
import { getExtractRegionRecordById } from '../repositories/images';
import { config } from '../config'
import { cropProcessor } from '../services/images';

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

const toOffset = (input: {
    size: number;
    ratio: number;
    limit: number;
}): number => {
    const offset = ~~(input.size * input.ratio);
    if (offset + input.limit > input.size) throw new HttpBadRequestError(
        "Offset out of bounds"
    );

    return offset;
}

export const cropHandler = (ctx: RouterContext) => {
    const paramsResult = paramsSchema.safeParse(ctx.params);
    if (!paramsResult.success) throw new HttpBadRequestError("Invalid URL parameters");

    const bodyResult = bodySchema.safeParse(ctx.request.body);
    if (!bodyResult.success) throw new HttpBadRequestError("Invalid request body");

    const extractRegionRecord = getExtractRegionRecordById(paramsResult.data.id);
    if (!extractRegionRecord) throw new HttpNotFoundError("Image not found");

    const left = toOffset({
        size: extractRegionRecord.extractRegion.width,
        ratio: bodyResult.data.extract_left_ratio,
        limit: config.screenWidth,
    });

    const top = toOffset({
        size: extractRegionRecord.extractRegion.height,
        ratio: bodyResult.data.extract_top_ratio,
        limit: config.screenHeight,
    });

    if (
        left === extractRegionRecord.extractRegion.left &&
        top === extractRegionRecord.extractRegion.top
    ) {
        ctx.body = {
            data: {
                type: "unchanged",
            },
        };

        return;
    }

    ctx.body = {
        data: {
            type: "processing",
            taskId: cropProcessor({
                current: extractRegionRecord,
                left,
                top,
            }),
        },
    };
}
