import { randomUUID } from 'node:crypto';
import { PassThrough } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { z } from 'zod';
import type { Context } from 'koa';

import config from '../config';
import { getExtractRegionRecordByHash } from '../repositories/images';
import { HttpBadRequestError } from '../middleware/errorHandler';
import { uploadProcessor, InvalidBufferError } from '../services/upload';
import { createMaxSizeTransform, MaxSizeError } from '../utils/transforms';
import type { ExtractRegionRecord } from '../models/image';

const headerSchema = z.object({
    'content-type': z.string().regex(/^image\//i).optional(),
    'content-length': z.coerce.number().int().positive().max(config.sizeLimit).optional(),
    'content-hash': z.string().length(64).regex(/^[\p{Hex_Digit}]+$/u).optional(),
    'file-name': z.string().max(255).optional(),
});

const respondExisting = (ctx: Context, record: ExtractRegionRecord) =>
    ctx.body = {
        data: {
            type: "existing",
            record,
        },
    };

export default async (ctx: Context) => {
    const headerResult = headerSchema.safeParse(ctx.request.headers);
    if (!headerResult.success) throw new HttpBadRequestError(
        "Invalid headers"
    )

    const headerHash = headerResult.data['content-hash'];
    if (headerHash) {
        const extractRegionRecord = getExtractRegionRecordByHash(headerHash);

        if (extractRegionRecord) {
            respondExisting(ctx, extractRegionRecord);
            return;
        }
    }

    const timeoutSignal = AbortSignal.timeout(config.uploadTimeout);
    const existingController = new AbortController();
    const taskController = new AbortController();
    const signal = AbortSignal.any([
        timeoutSignal,
        existingController.signal,
        taskController.signal,
    ]);

    const taskId = randomUUID();
    const tee = new PassThrough();
    const { metadata, hash } = uploadProcessor(taskId, tee, signal);

    hash.then(
        hex => {
            const extractRegionRecord = getExtractRegionRecordByHash(hex);
            if (!extractRegionRecord) return;

            existingController.abort();
            respondExisting(ctx, extractRegionRecord);
        },
        () => {}
    );

    try {
        await Promise.all([
            pipeline(
                ctx.req,
                createMaxSizeTransform(config.sizeLimit),
                tee,
                { signal }
            ),
            metadata,
            hash,
        ]);

        if (existingController.signal.aborted) return;
        ctx.body = {
            data: {
                type: "processing",
                taskId,
            },
        };
    } catch (err) {
        if (timeoutSignal.aborted) throw new HttpBadRequestError(
            "Request timeout"
        );

        taskController.abort();

        if (err instanceof MaxSizeError) throw new HttpBadRequestError(
            `Max ${config.sizeLimit} bytes`
        );

        if (err instanceof InvalidBufferError) throw new HttpBadRequestError(
            "Invalid image buffer"
        );

        throw err;
    }
}
