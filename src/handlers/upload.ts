import { getStreamAsBuffer, MaxBufferError } from 'get-stream';
import type { Context } from 'koa';

import config from '../utils/config';
import { HttpBadRequestError } from '../middleware/errorHandler';
import { initiate, InvalidBufferError } from '../services/initiate';

export default async (ctx: Context) => {
    const buf = await getStreamAsBuffer(ctx.req, { maxBuffer: config.sizeLimit })
        .catch(err => {
            if (err instanceof MaxBufferError) throw new HttpBadRequestError(
                `Max ${config.sizeLimit} bytes`
            );

            throw err;
        });
    if (buf.length === 0) throw new HttpBadRequestError("Invalid request body");

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
