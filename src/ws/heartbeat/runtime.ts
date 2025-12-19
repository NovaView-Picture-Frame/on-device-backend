import { randomBytes } from "node:crypto";
import type { WebSocket } from "ws";

import { reducer } from "./reducer";
import type { State, Event, Action, OnOkInput, OnFailInput } from "./types";

export const setupHeartbeat = (input: {
    ws: WebSocket;
    intervalMs: number;
    timeoutMs: number;
    onOk?: (input: OnOkInput) => void | Promise<void>;
    onFail: (input: OnFailInput) => void | Promise<void>;
}) => {
    const { ws, intervalMs, timeoutMs, onOk, onFail } = input;

    let state: State = { phase: "running", sub: "idle", consecutive: 0 };

    const queue: Event[] = [];
    let intervalTimer: NodeJS.Timeout | null = null;
    let timeoutTimer: NodeJS.Timeout | null = null;
    let cleaned = false;
    let draining = false;

    const clearTimeoutTimer = () => {
        if (!timeoutTimer) return;
        clearTimeout(timeoutTimer);
        timeoutTimer = null;
    };

    const cleanup = () => {
        if (cleaned) return;
        cleaned = true;

        if (intervalTimer) clearInterval(intervalTimer);
        intervalTimer = null;
        clearTimeoutTimer();

        ws.off("pong", onPong);
        ws.off("close", stop);
        ws.off("error", stop);
    };

    const dispatch = (event: Event) => {
        if (cleaned && event.type !== "STOP") return;

        if (event.type === "STOP") queue.length = 0;
        queue.push(event);

        if (draining) return;
        draining = true;

        try {
            while (!cleaned) {
                const event = queue.shift();
                if (!event) break;

                const { nextState, actions } = reducer({ state, event, handledAt: new Date() });

                state = nextState;
                actions?.forEach(exec);
            }

            if (cleaned) queue.length = 0;
        } finally {
            draining = false;
        }
    };

    const stop = () => dispatch({ type: "STOP" });

    const exec = (action: Action) => {
        if (cleaned && action.type !== "CLEANUP") return;

        switch (action.type) {
            case "PING":
                try {
                    ws.ping(action.heartbeatTag);
                } catch {
                    dispatch({
                        type: "FAIL",
                        reason: "ping_error",
                        heartbeatTag: action.heartbeatTag,
                    });
                }
                break;

            case "SET_TIMEOUT":
                clearTimeoutTimer();
                timeoutTimer = setTimeout(() => {
                    timeoutTimer = null;
                    dispatch({
                        type: "FAIL",
                        reason: "timeout",
                        heartbeatTag: action.heartbeatTag,
                    });
                }, timeoutMs);
                timeoutTimer.unref();
                break;

            case "CLEAR_TIMEOUT":
                clearTimeoutTimer();
                break;

            case "CALL_OK":
                Promise.resolve(onOk?.({
                        ws: ws,
                        sentAt: action.sentAt,
                        receivedAt: action.receivedAt,
                        heartbeatTag: action.heartbeatTag,
                })).catch(err => {
                    console.error("onOk handler error:", err);
                    stop();
                });
                break;

            case "CALL_FAIL":
                Promise.resolve(onFail({
                    ws: ws,
                    reason: action.reason,
                    at: action.at,
                    sentAt: action.sentAt,
                    heartbeatTag: action.heartbeatTag,
                    consecutive: action.consecutive,
                })).catch(err => {
                    console.error("onFail handler error:", err);
                    stop();
                });
                break;

            case "CLEANUP":
                cleanup();
                break;

            default:
                action satisfies never;
        }
    };

    const onPong = (data: Buffer) => dispatch({ type: "PONG", heartbeatTag: data });

    ws.on("pong", onPong);
    ws.once("close", stop);
    ws.once("error", stop);

    intervalTimer = setInterval(() => {
        if (state.phase !== "running" || state.sub !== "idle") return;

        dispatch({ type: "TICK", heartbeatTag: randomBytes(16) });
    }, intervalMs);
    intervalTimer.unref();

    return stop;
};
