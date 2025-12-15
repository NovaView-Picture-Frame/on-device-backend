import { z } from "zod";
import type { UUID } from "node:crypto";
import type { WebSocket, RawData } from "ws";
import type { FastifyRequest } from "fastify";

import { HttpBadRequestError } from "../../middleware/errorHandler";
import { appConfig } from "../../config";
import { setupHeartbeat } from "../heartbeat";
import { handleConnected, handleClosed, requestSchedule } from "../../services/images/carousel";
import { ClientMessageSchema } from "../../models/carousel";

interface Context {
    deviceId: UUID;
}

const headerSchema = z.object({ "device-id": z.uuidv4().pipe(z.custom<UUID>()) });

const contextMap = new WeakMap<FastifyRequest, Context>();

export const carouselUpgradeHandler = async (req: FastifyRequest) => {
    const headerResult = headerSchema.safeParse(req.headers);
    if (!headerResult.success) throw new HttpBadRequestError("Invalid headers");

    contextMap.set(req, { deviceId: headerResult.data["device-id"] });
};

export const carouselHandler = (ws: WebSocket, req: FastifyRequest) => {
    const context = contextMap.get(req);
    if (!context) throw new Error("Context not found for WebSocket");

    setupHeartbeat({
        ws,
        intervalMs: appConfig.runtime.websocket_heartbeat_interval_ms,
        timeoutMs: appConfig.runtime.websocket_heartbeat_timeout_ms,
        onFail: ({ reason }) => {
            console.log(`Heartbeat failed (${reason}) for device: ${context.deviceId}`);
            ws.terminate();
        },
    });

    ws.on("message", (raw: RawData) => {
        try {
            const message = ClientMessageSchema.parse(JSON.parse(raw.toString()));

            switch (message.type) {
                case "requestSchedule":
                    requestSchedule(context.deviceId);
                    console.log(
                        `Schedule requested at ${new Date().toISOString()} (device: ${context.deviceId})`,
                    );
                    break;

                case "preloadComplete":
                    console.log(
                        `Preload complete: ${message.payload.id} at ${message.payload.timeStamp.toISOString()} (device: ${context.deviceId})`,
                    );
                    break;
            }
        } catch {
            ws.send(JSON.stringify({ type: "error", message: "Invalid message" }));
        }
    });

    ws.on("close", () => {
        handleClosed(context.deviceId, ws);
        contextMap.delete(req);
    });

    handleConnected(context.deviceId, ws);
};
