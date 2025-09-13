import stream from 'node:stream';
import { z } from 'zod';
import type { RouterContext } from '@koa/router';

import { HttpBadRequestError, HttpNotFoundError } from '../middleware/errorHandler';
import { tasksMap } from '../services/crop';
import config from '../utils/config';

const paramsSchema = z.object({
    taskId: z.uuidv4(),
});

export default async (ctx: RouterContext) => {
    const paramsResult = paramsSchema.safeParse(ctx.params);
    if (!paramsResult.success) throw new HttpBadRequestError(
        "Invalid URL parameters"
    )

    const entry = tasksMap.get(paramsResult.data.taskId);
    if (!entry) throw new HttpNotFoundError(
        "Task not found"
    )

    const sse = new stream.PassThrough();
    sse.write("event: connected\ndata:\n\n");

    const keepAlive = setInterval(
        () => sse.write(':\n\n'),
        config.sseKeepaliveInterval
    );

    const finish = () => {
        clearInterval(keepAlive);
        sse.end();
    };

    entry.tasks.crop.then(
        () => sse.write("event: cropComplete\ndata:\n\n"),
        () => sse.write(
            `event: cropError\ndata: ${JSON.stringify({
                data: {
                    message: "Failed to create cropped image",
                },
            })}\n\n`
        )
    );

    entry.tasks.persist
        .then(
            () => sse.write("event: persistComplete\ndata:\n\n"),
            () => sse.write(
                `event: persistError\ndata: ${JSON.stringify({
                    data: {
                        message: "Failed to persist image data",
                    },
                })}\n\n`
            )
        ).finally(() => {
            sse.write(`event: done\ndata:\n\n`);
            finish();
        });

    ctx.req.on('close', finish);
    ctx.set({
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive'
    });
    ctx.body = sse;
}
