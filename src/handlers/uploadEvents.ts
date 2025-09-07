import stream from 'node:stream';
import { z } from 'zod';
import type { RouterContext } from '@koa/router';

import { HttpBadRequestError, HttpNotFoundError } from '../middleware/errorHandler';
import { processing } from '../services/initiate';
import config from '../utils/config';

const paramsSchema = z.object({
    taskId: z.uuid(),
});

export default async (ctx: RouterContext) => {
    const paramsResult = paramsSchema.safeParse(ctx.params);
    if (!paramsResult.success) throw new HttpBadRequestError(
        "Invalid URL parameters"
    );

    const process = processing.get(paramsResult.data.taskId);
    if (!process) throw new HttpNotFoundError(
        "Task not found"
    );

    const sse = new stream.PassThrough();
    sse.write("event: connected\ndata:\n\n");
    const keepAlive = setInterval(
        () => sse.write(':\n\n'),
        config.sseKeepaliveInterval
    );
    keepAlive.unref();

    process.step1.then(uuid => sse.write(
        `event: step1Complete\ndata: ${JSON.stringify({
            data: { uuid }
        })}\n\n`
    ));

    process.step2.then(uuid => sse.write(
        `event: step2Complete\ndata: ${JSON.stringify({
            data: { uuid }
        })}\n\n`
    ));

    const finish = () => {
        clearInterval(keepAlive);
        sse.end();
    }

    Promise.allSettled([process.step1, process.step2]).finally(() => {
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
