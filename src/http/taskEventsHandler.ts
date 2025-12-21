import { z } from "zod";
import type { UUID } from "node:crypto";
import type { FastifyRequest, FastifyReply } from "fastify";

import { uuidSchema } from "../utils/zod";
import { HttpBadRequestError, HttpNotFoundError } from "../middleware/errorHandler";

interface TaskEvents {
    [taskName: string]: Promise<object | null>;
}

export interface TaskEventsGetter {
    (taskId: UUID): TaskEvents | undefined;
}

interface Context {
    taskEvents: TaskEvents;
}

const paramsSchema = z.strictObject({
    taskId: uuidSchema,
});

const contextMap = new WeakMap<FastifyRequest, Context>();

export const buildPre = (getTaskEvents: TaskEventsGetter) =>
    async (req: FastifyRequest) => {
        const paramsResult = paramsSchema.safeParse(req.params);
        if (!paramsResult.success) {
            throw new HttpBadRequestError("Invalid URL parameters");
        }

        const taskEvents = getTaskEvents(paramsResult.data.taskId);
        if (!taskEvents) {
            throw new HttpNotFoundError("Task not found");
        }

        req.headers = {
            ...req.headers,
            accept: "text/event-stream",
        };

        contextMap.set(req, { taskEvents });
    };

export const buildBase = () =>
    async (req: FastifyRequest, reply: FastifyReply) => {
    const context = contextMap.get(req);
    if (!context) throw new Error("Context not found for request");

    const safeSend = (...args: Parameters<typeof reply.sse.send>) =>
        reply.sse.send(...args).catch(() => reply.sse.close());

        const notifiers = Object.entries(context.taskEvents).map(
            ([taskName, taskEventPromise]) =>
                taskEventPromise.then(
                    resolve => resolve !== null
                        ? safeSend({ event: `${taskName}Complete`, data: resolve })
                        : null,
                    reject => reject !== null
                        ? safeSend({ event: `${taskName}Error`, data: reject })
                        : null
                )
    );

    try {
        await safeSend({ event: "connected", data: {} });
        await Promise.allSettled(notifiers);
        await safeSend({ event: "done", data: {} });
    } finally {
        reply.sse.close();
        contextMap.delete(req);
    }
};
