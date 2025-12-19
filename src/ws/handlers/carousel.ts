import { z } from "zod";
import type { UUID } from "node:crypto";
import { WebSocket, type RawData } from "ws";
import type { FastifyRequest } from "fastify";

import { uuidSchema } from "../../utils/zod";
import { HttpBadRequestError } from "../../middleware/errorHandler";
import { appConfig } from "../../config";
import { setupHeartbeat } from "../heartbeat";
import { subscribeSchedule, requestSchedule } from "../../services/carousel";
import { ClientMessageSchema, type NewSchedule } from "../../models/carousel";

interface Context {
    deviceId: UUID;
}

const headerSchema = z.object({ "device-id": uuidSchema });

const contextMap = new WeakMap<FastifyRequest, Context>();

export const carouselPreValidation = async (req: FastifyRequest) => {
    const headerResult = headerSchema.safeParse(req.headers);
    if (!headerResult.success) throw new HttpBadRequestError("Invalid headers");

    contextMap.set(req, { deviceId: headerResult.data["device-id"] });
};

export const carouselHandler = (ws: WebSocket, req: FastifyRequest) => {
    const context = contextMap.get(req);
    if (!context) throw new Error("Context not found for request");

    setupHeartbeat({
        ws,
        intervalMs: appConfig.runtime.websocket_heartbeat_interval_ms,
        timeoutMs: appConfig.runtime.websocket_heartbeat_timeout_ms,
        onFail: ({ reason }) => {
            console.log(`Heartbeat failed (${reason}) for device: ${context.deviceId}`);
            ws.terminate();
        },
    });

    const listener = (message: NewSchedule) => {
        if (ws.readyState !== WebSocket.OPEN) return;
        ws.send(JSON.stringify(message));
    };

    ws.on("message", (raw: RawData) => {
        try {
            const message = ClientMessageSchema.parse(JSON.parse(String(raw)));

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

    const unsubscribe = subscribeSchedule(context.deviceId, listener);

    let cleaned = false;
    const cleanUp = () => {
        if (cleaned) return;
        cleaned = true;

        ws.off("close", cleanUp);
        ws.off("error", cleanUp);

        try {
            unsubscribe();
        } catch (err) {
            console.warn("Cleanup failed:", err);
        } finally {
            contextMap.delete(req);
        }
    };

    ws.once("close", cleanUp);
    ws.once("error", cleanUp);
};
