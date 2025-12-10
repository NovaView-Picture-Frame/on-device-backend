import stream from 'node:stream';
import { z } from 'zod';
import type { UUID } from 'node:crypto';
import type { RouterContext } from '@koa/router';

import { HttpBadRequestError, HttpNotFoundError } from '../../middleware/errorHandler';
import { config } from '../../config';

export type TaskEventsGetter = (taskId: UUID) =>
    Record<string, Promise<object | null>> | undefined;

const paramsSchema = z.object({
    taskId: z.uuidv4().pipe(
        z.custom<UUID>()
    ),
});

export const buildTaskEventsHandler = (getTaskEvents: TaskEventsGetter) =>
    (ctx: RouterContext) => {
        const paramsResult = paramsSchema.safeParse(ctx.params);
        if (!paramsResult.success) throw new HttpBadRequestError(
            "Invalid URL parameters"
        );

        const tasks = getTaskEvents(paramsResult.data.taskId);
        if (!tasks) throw new HttpNotFoundError(
            "Task not found"
        );

        const sse = new stream.PassThrough();
        sse.write("event: connected\ndata:\n\n");

        const keepAlive = setInterval(
            () => sse.write(':\n\n'),
            config.sseKeepaliveIntervalMs
        );

        const finish = () => {
            clearInterval(keepAlive);
            sse.end();
        };

        const writeEvent = (event: string, data: object) => sse.write(
            `event: ${event}\ndata: ${JSON.stringify({ data })}\n\n`
        );

        Promise.allSettled(
            Object.entries(tasks).map(([taskName, taskEventPromise]) =>
                taskEventPromise.then(
                    resolve => resolve !== null && writeEvent(
                        `${taskName}Complete`, resolve
                    ),
                    reject => reject !== null && writeEvent(
                        `${taskName}Error`, reject
                    )
                )
            )
        ).then(() => {
            sse.write(`event: done\ndata:\n\n`);
            finish();
        });

        ctx.req.on('close', finish);
        ctx.set({
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache, no-transform',
            'Connection': 'keep-alive',
        });
        ctx.body = sse;
    }
