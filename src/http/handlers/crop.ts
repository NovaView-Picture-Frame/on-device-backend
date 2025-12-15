import { z } from "zod";
import type { FastifyRequest } from "fastify";

import { HttpBadRequestError, HttpNotFoundError } from "../../middleware/errorHandler";
import { getExtractRegionRecordById } from "../../repositories/images";
import { appConfig } from "../../config";
import { cropProcessor } from "../../services/images";

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
            extract_left_ratio === 0 || extract_top_ratio === 0,
    );

const toOffset = (input: {
    size: number;
    ratio: number;
    limit: number;
}): number => {
    const offset = ~~(input.size * input.ratio);
    if (input.size + offset > input.limit) throw new HttpBadRequestError(
        "Offset out of bounds"
    );

    return offset;
};

export const cropHandler = (req: FastifyRequest) => {
    const paramsResult = paramsSchema.safeParse(req.params);
    if (!paramsResult.success) throw new HttpBadRequestError("Invalid URL parameters");

    const bodyResult = bodySchema.safeParse(req.body);
    if (!bodyResult.success) throw new HttpBadRequestError("Invalid request body");

    const extractRegionRecord = getExtractRegionRecordById(paramsResult.data.id);
    if (!extractRegionRecord) throw new HttpNotFoundError("Image not found");

    const left = toOffset({
        size: appConfig.device.screen.width,
        ratio: bodyResult.data.extract_left_ratio,
        limit: extractRegionRecord.extractRegion.width,
    });

    const top = toOffset({
        size: appConfig.device.screen.height,
        ratio: bodyResult.data.extract_top_ratio,
        limit: extractRegionRecord.extractRegion.height,
    });

    if (
        left === extractRegionRecord.extractRegion.left &&
        top === extractRegionRecord.extractRegion.top
    ) return {
        data: { type: "unchanged" },
    };

    return {
        data: {
            type: "processing",
            taskId: cropProcessor({
                current: extractRegionRecord,
                left,
                top,
            }),
        },
    };
};
