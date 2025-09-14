import stream from 'node:stream';
import { z } from 'zod';
import type { RouterContext } from '@koa/router';

import { HttpBadRequestError, HttpNotFoundError } from '../middleware/errorHandler';
import { tasksMap } from '../services/upload';
import config from '../utils/config';

const paramsSchema = z.object({
    taskId: z.uuidv4(),
});

export default async (ctx: RouterContext) => {
    const paramsResult = paramsSchema.safeParse(ctx.params);
    if (!paramsResult.success) throw new HttpBadRequestError(
        "Invalid URL parameters"
    )

    const tasks = tasksMap.get(paramsResult.data.taskId);
    if (!tasks) throw new HttpNotFoundError(
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

    tasks.lookupPlace.then(
        place => sse.write(
            `event: lookupPlaceComplete\ndata: ${JSON.stringify({
                data: { place },
            })}\n\n`
        ),
        () => sse.write(
            `event: lookupPlaceError\ndata: ${JSON.stringify({
                data: {
                    message: "Failed to look up place",
                },
            })}\n\n`
        )
    );

    tasks.saveOriginal.then(
        null,
        () => sse.write(
            `event: saveOriginalError\ndata: ${JSON.stringify({
                data: {
                    message: "Failed to save original image",
                },
            })}\n\n`
        )
    );

    tasks.crop.then(
        region => sse.write(
            `event: cropComplete\ndata: ${JSON.stringify({
                data: { region },
            })}\n\n`
        ),
        () => sse.write(
            `event: cropError\ndata: ${JSON.stringify({
                data: {
                    message: "Failed to create cropped image",
                },
            })}\n\n`
        )
    );

    tasks.optimize.then(
        null,
        () => sse.write(
            `event: optimizeError\ndata: ${JSON.stringify({
                    data: {
                        message: "Failed to create optimized image",
                    },
            })}\n\n`
        )
    );

    tasks.persist
        .then(
            id => sse.write(
                `event: persistComplete\ndata: ${JSON.stringify({
                    data: { id }
                })}\n\n`
            ),
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
