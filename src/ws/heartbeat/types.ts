import type { WebSocket } from "ws";

interface OnOk {
    sentAt: Date;
    receivedAt: Date;
    heartbeatTag: Buffer;
}

export interface OnOkInput extends OnOk {
    ws: WebSocket;
}

type FailReason = "timeout" | "ping_error";

interface OnFail {
    reason: FailReason;
    at: Date;
    sentAt: Date;
    heartbeatTag: Buffer;
    consecutive: number;
}

export interface OnFailInput extends OnFail {
    ws: WebSocket;
}

type RunningSubState = 
    | { sub: "idle" }
    | { sub: "waitingPong"; sentAt: Date; heartbeatTag: Buffer };

export type State =
    | { phase: "running"; consecutive: number } & RunningSubState
    | { phase: "stopped" };

export type Event =
    | { type: "TICK"; heartbeatTag: Buffer }
    | { type: "PONG"; heartbeatTag: Buffer }
    | { type: "FAIL"; reason: FailReason; heartbeatTag: Buffer }
    | { type: "STOP" };

export type Action =
    | { type: "SET_TIMEOUT"; heartbeatTag: Buffer }
    | { type: "CLEAR_TIMEOUT" }
    | { type: "PING"; heartbeatTag: Buffer }
    | { type: "CALL_OK" } & OnOk
    | { type: "CALL_FAIL" } & OnFail
    | { type: "CLEANUP" };
