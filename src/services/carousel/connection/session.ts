import { promisify } from "node:util";
import type { UUID } from "node:crypto";
import type { WebSocket } from "ws";

import { createThresholdTrigger } from "../../../utils/thresholdTrigger";
import { config } from "../../../config";
import { carouselClientMessageSchema, type CarouselServerMessage } from "../../../models/carousel";
import { setupHeartbeat } from "../../../ws/heartbeat";
import { createCarouselChannel } from "./channel";

export const createCarouselSession = (input: {
    ws: WebSocket;
    clientId: UUID;
    onSessionEnd: () => void;
}) => {
    const { ws, clientId, onSessionEnd } = input

    const { step, reset } = createThresholdTrigger(
        config.runtime.websocket.retries + 1,
        () => cleanup(true),
    );

    const sendPromise = promisify(ws.send.bind(ws));
    const send = (message: CarouselServerMessage) =>
        sendPromise(JSON.stringify(message)).catch(err => {
            step();
            console.error(`Sending message failed for client: '${clientId}':`, err);
        });

    const { onMessage, dispose } = createCarouselChannel(
        clientId,
        (message: CarouselServerMessage) => send(message),
    );

    ws.on("message", raw => {
        reset();

        try {
            const rawMessage = JSON.parse(String(raw));
            const message = carouselClientMessageSchema.parse(rawMessage);
            onMessage(message);
        } catch (err) {
            console.error(`Invalid message from client: '${clientId}':`, err);
            send({ type: "error", message: "Invalid message" });
        };
    })

    const onClose = () => cleanup();
    const onError = () => cleanup(true);
    ws.once("close", onClose);
    ws.once("error", onError);

    const stopHeartbeat = setupHeartbeat({
        ws,
        intervalMs: config.runtime.websocket.heartbeat.interval_ms,
        timeoutMs: config.runtime.websocket.heartbeat.timeout_ms,
        onOk: () => reset(),
        onFail: ({ reason }) => {
            step();
            console.error(`Heartbeat failed for client: '${clientId}':`, reason);
        },
    });

    let cleaned = false;
    const cleanup = (isError: boolean = false) => {
        if (cleaned) return;
        cleaned = true;

        ws.off("message", onMessage);
        ws.off("close", onClose);
        ws.off("error", onError);
        if (isError) ws.terminate();

        try {
            dispose();
        } catch (err) {
            console.error("Error disposing carousel channel:", err);
        };

        try {
            stopHeartbeat();
        } catch (err) {
            console.error("Error stopping heartbeat:", err);
        };

        try {
            onSessionEnd();
        } catch (err) {
            console.error("Error in session end handler:", err);
        };

        console.log(`Carousel session ended for client: '${clientId}'`);
    };

    console.log(`Carousel session started for client: '${clientId}'`);
};
