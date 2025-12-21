import { z } from "zod";
import type { UUID } from "node:crypto";
import { WebSocket} from "ws";
import type { FastifyRequest } from "fastify";

import { uuidSchema } from "../../utils/zod";
import { HttpBadRequestError } from "../../middleware/errorHandler";
import { createCarouselSession } from "../../services/carousel";

interface Context {
    clientId: UUID;
}

const headerSchema = z.object({ "client-id": uuidSchema });

const contextMap = new WeakMap<FastifyRequest, Context>();

export const carouselPreValidation = async (req: FastifyRequest) => {
    const headerResult = headerSchema.safeParse(req.headers);
    if (!headerResult.success) throw new HttpBadRequestError("Invalid headers");

    contextMap.set(req, { clientId: headerResult.data["client-id"] });
};

export const carouselHandler = (ws: WebSocket, req: FastifyRequest) => {
    const context = contextMap.get(req);
    if (!context) throw new Error("Context not found for request");

    createCarouselSession({
        ws,
        clientId: context.clientId,
        onSessionEnd: () => contextMap.delete(req),
    });
};
