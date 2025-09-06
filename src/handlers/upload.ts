import { getStreamAsBuffer, MaxBufferError } from 'get-stream';
import { z } from 'zod';
import type { Context } from 'koa';

import config from '../utils/config';
import { HttpBadRequestError } from '../middleware/errorHandler';
import { initiate, InvalidBufferError } from '../services/initiate';

const headerSchema = z.object({
    'content-type': z.string().regex(/^image\//i).optional(),
    'content-length': z.coerce.number().int().max(config.sizeLimit).optional(),
});

export default async (ctx: Context) => {
    const headerResult = headerSchema.safeParse(ctx.request.headers);
    if (!headerResult.success) throw new HttpBadRequestError(
        "Invalid headers"
    );

    const buf = await getStreamAsBuffer(ctx.req, { maxBuffer: config.sizeLimit })
        .catch(err => {
            if (err instanceof MaxBufferError) throw new HttpBadRequestError(
                `Max ${config.sizeLimit} bytes`
            );

            throw err;
        });
    if (buf.length === 0) throw new HttpBadRequestError("Empty body");

    const taskId = await initiate(buf).catch(err => {
        if (err instanceof InvalidBufferError) throw new HttpBadRequestError(
            "Invalid image buffer"
        );

        throw err;
    });

    ctx.body = {
        data: { taskId }
    };
}
