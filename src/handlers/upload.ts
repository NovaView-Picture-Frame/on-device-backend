import { randomUUID } from 'node:crypto';
import { PassThrough } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { z } from 'zod';
import type { Context } from 'koa';

import config from '../utils/config';
import { HttpBadRequestError } from '../middleware/errorHandler';
import { uploadProcessor, InvalidBufferError } from '../services/upload';
import { getByHash } from '../repositories/images';
import { createMaxSizeTransform, MaxSizeError } from '../services/transformers';

const headerSchema = z.object({
    'content-type': z.string().regex(/^image\//i).optional(),
    'content-length': z.coerce.number().int().positive().max(config.sizeLimit).optional(),
    'content-hash': z.string().length(64).regex(/^[\p{Hex_Digit}]+$/u).optional(),
})
.strict();

export default async (ctx: Context) => {
    const headerResult = headerSchema.safeParse(ctx.request.headers);
    if (!headerResult.success) throw new HttpBadRequestError(
        "Invalid headers"
    )

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
    const { hash, metadata } = uploadProcessor(taskId, tee, signal);
    const headerHash = headerResult.data['content-hash'];

    (headerHash ? Promise.resolve(Buffer.from(headerHash, 'hex')) : hash)
        .then(buffer => {
            const record = getByHash(buffer);
            if (!record) return;

            existingController.abort();
            ctx.body = {
                data: {
                    type: "existing",
                    record,
                },
            };
        });

    try {
        await Promise.all([
            pipeline(
                ctx.req,
                createMaxSizeTransform(config.sizeLimit),
                tee,
                { signal }
            ),
            hash,
            metadata
        ]);

        ctx.body = {
            data: {
                type: "processing",
                taskId,
            },
        };
    } catch (err) {
        if (existingController.signal.aborted) return;

        if (timeoutSignal.aborted)throw new HttpBadRequestError(
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
