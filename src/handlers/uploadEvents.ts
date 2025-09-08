import stream from 'node:stream';
import { z } from 'zod';
import type { RouterContext } from '@koa/router';

import { HttpBadRequestError, HttpNotFoundError } from '../middleware/errorHandler';
import { tasksMap } from '../services/initiate';
import config from '../utils/config';

const paramsSchema = z.object({
    taskId: z.uuid(),
});

export default async (ctx: RouterContext) => {
    const paramsResult = paramsSchema.safeParse(ctx.params);
    if (!paramsResult.success) throw new HttpBadRequestError(
        "Invalid URL parameters"
    );

    const tasks = tasksMap.get(paramsResult.data.taskId);
    if (!tasks) throw new HttpNotFoundError(
        "Task not found"
    );

    const sse = new stream.PassThrough();
    sse.write("event: connected\ndata:\n\n");
    const keepAlive = setInterval(
        () => sse.write(':\n\n'),
        config.sseKeepaliveInterval
    ).unref();

    tasks.crop.then(result => sse.write(
        `event: resizeComplete\ndata: ${JSON.stringify({
            data: {
                extract_left_ratio: result.extract_left / result.extract_width,
                extract_top_ratio: result.extract_top / result.extract_height,
            }
        })}\n\n`
    ));

    tasks.crop.catch(() => sse.write(
        `event: cropError\ndata: ${JSON.stringify({
            data: {
                message: "Failed to create cropped image"
            }
        })}\n\n`
    ));

    tasks.saveOriginal.catch(() => sse.write(
        `event: saveOriginalError\ndata: ${JSON.stringify({
            data: {
                message: "Failed to save original image"
            }
        })}\n\n`
    ));

    tasks.optimize.catch(() => sse.write(
        `event: optimizeError\ndata: ${JSON.stringify({
            data: {
                message: "Failed to create optimized image"
            }
        })}\n\n`
    ));

    const finish = () => {
        clearInterval(keepAlive);
        sse.end();
    }

    Promise.allSettled(Object.values(tasks)).finally(() => {
        sse.write(`event: done\ndata:\n\n`);
        finish();
    });

    ctx.set({
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive'
    });
    ctx.body = sse;
    ctx.req.on('close', finish);
    ctx.res.on('close', finish);
}
