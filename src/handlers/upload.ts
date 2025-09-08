import { TransformStream } from 'node:stream/web';
import { randomUUID } from 'node:crypto';
import { Readable } from 'node:stream';
import { z } from 'zod';
import type { Context } from 'koa';

import config from '../utils/config';
import { HttpBadRequestError } from '../middleware/errorHandler';
import { initiate, InvalidBufferError } from '../services/initiate';

class MaxSizeError extends Error {}

class MaxSizeTransform extends TransformStream<Uint8Array, Uint8Array> {
    private total = 0;
    private readonly limit: number;

    constructor(limit: number) {
        super({
            transform: (chunk, controller) => {
                this.total += chunk.byteLength;
                return this.total > this.limit
                    ? controller.error(new MaxSizeError())
                    : controller.enqueue(chunk);
            }
        });

        this.limit = limit;
    }
}

const headerSchema = z.object({
    'content-type': z.string().regex(/^image\//i).optional(),
    'content-length': z.coerce.number().int().positive().max(config.sizeLimit).optional(),
});

export default async (ctx: Context) => {
    const headerResult = headerSchema.safeParse(ctx.request.headers);
    if (!headerResult.success) throw new HttpBadRequestError(
        "Invalid headers"
    );

    const signal = AbortSignal.timeout(config.uploadTimeout);
    const taskId = randomUUID();

    const { writable, readable } = new MaxSizeTransform(config.sizeLimit);
    const streamWithMaxSize = Readable.toWeb(ctx.req).pipeTo(writable, { signal });

    try {
        await Promise.all([
            streamWithMaxSize,
            initiate(readable, taskId, signal)
        ]);

        ctx.body = { data: { taskId } };
    } catch (err) {
        if (signal.aborted) throw new HttpBadRequestError(
            "Request aborted"
        );

        if (err instanceof MaxSizeError) throw new HttpBadRequestError(
            `Max ${config.sizeLimit} bytes`
        );

        if (err instanceof InvalidBufferError) throw new HttpBadRequestError(
            "Invalid image buffer"
        );

        throw err;
    }
}
