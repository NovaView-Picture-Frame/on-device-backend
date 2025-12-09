import { randomUUID } from 'node:crypto';
import { PassThrough } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { z } from 'zod';
import type { Context } from 'koa';

import { config } from '../config';
import { HttpBadRequestError } from '../middleware/errorHandler';
import { getExtractRegionRecordByHash } from '../repositories/images';
import { uploadProcessor, InvalidBufferError } from '../services/images';
import { createMaxSizeTransform, MaxSizeError } from '../utils/transforms';
import type { ExtractRegionRecord } from '../models/images';

const headerSchema = z.object({
    'content-type': z.string().regex(/^image\//i).optional(),
    'content-length': z.coerce.number().int().positive().max(config.sizeLimitBytes).optional(),
    'content-hash': z.string().length(64).regex(/^\p{Hex_Digit}+$/v).optional(),
    'file-name': z.string().max(255).optional(),
});

const respondExisting = (ctx: Context, record: ExtractRegionRecord) =>
    ctx.body = {
        data: {
            type: "existing",
            record,
        },
    };

export const uploadHandler = async (ctx: Context) => {
    const headerResult = headerSchema.safeParse(ctx.request.headers);
    if (!headerResult.success) throw new HttpBadRequestError(
        "Invalid headers"
    );

    const headerHash = headerResult.data['content-hash'];
    if (headerHash) {
        const extractRegionRecord = getExtractRegionRecordByHash(headerHash);

        if (extractRegionRecord) {
            respondExisting(ctx, extractRegionRecord);
            return;
        }
    }

    const timeoutController = new AbortController();
    const existingController = new AbortController();
    const taskController = new AbortController();
    const signal = AbortSignal.any([
        timeoutController.signal,
        existingController.signal,
        taskController.signal,
    ]);

    const taskId = randomUUID();
    const tee = new PassThrough();
    const hashAndMetadata = uploadProcessor({
        id: taskId,
        stream: tee,
        signal,
    });
    const timer = setTimeout(() => timeoutController.abort(), config.uploadTimeoutMs);

    hashAndMetadata.then(
        ({ hash }) => {
            const extractRegionRecord = getExtractRegionRecordByHash(hash);
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
                createMaxSizeTransform(config.sizeLimitBytes),
                tee,
                { signal }
            ),
            hashAndMetadata,
        ]);

        if (existingController.signal.aborted) return;

        ctx.body = {
            data: {
                type: "processing",
                taskId,
            },
        };
    } catch (err) {
        if (timeoutController.signal.aborted) throw new HttpBadRequestError(
            "Request timeout"
        );

        taskController.abort();

        if (err instanceof MaxSizeError) throw new HttpBadRequestError(
            `Max ${config.sizeLimitBytes} bytes`
        );

        if (err instanceof InvalidBufferError) throw new HttpBadRequestError(
            "Invalid image buffer"
        );

        throw err;
    } finally {
        clearTimeout(timer);
    }
}
