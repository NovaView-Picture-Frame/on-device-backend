import type { State, Event, Action } from "./types";

export const reducer = (input: {
    state: State;
    event: Event;
    handledAt: Date;
}): { nextState: State; actions?: Action[] } => {
    const { state, event, handledAt } = input;
    if (state.phase === "stopped") return { nextState: state };

    switch (event.type) {
        case "TICK":
            if (state.sub !== "idle") return { nextState: state };

            return {
                nextState: {
                    phase: "running",
                    sub: "waitingPong",
                    sentAt: handledAt,
                    heartbeatTag: event.heartbeatTag,
                    consecutive: state.consecutive,
                },
                actions: [
                    { type: "SET_TIMEOUT", heartbeatTag: event.heartbeatTag },
                    { type: "PING", heartbeatTag: event.heartbeatTag },
                ],
            };

        case "PONG":
            if (state.sub !== "waitingPong" || !state.heartbeatTag.equals(event.heartbeatTag))
                return { nextState: state };

            return {
                nextState: {
                    phase: "running",
                    sub: "idle",
                    consecutive: 0,
                },
                actions: [
                    { type: "CLEAR_TIMEOUT" },
                    {
                        type: "CALL_OK",
                        sentAt: state.sentAt,
                        receivedAt: handledAt,
                        heartbeatTag: event.heartbeatTag,
                    },
                ],
            };

        case "FAIL": {
            if (state.sub !== "waitingPong" || !state.heartbeatTag.equals(event.heartbeatTag))
                return { nextState: state };

            const consecutive = state.consecutive + 1;
            return {
                nextState: {
                    phase: "running",
                    sub: "idle",
                    consecutive,
                },
                actions: [
                    { type: "CLEAR_TIMEOUT" },
                    {
                        type: "CALL_FAIL",
                        reason: event.reason,
                        at: handledAt,
                        sentAt: state.sentAt,
                        heartbeatTag: state.heartbeatTag,
                        consecutive,
                    },
                ],
            };
        }

        case "STOP":
            return {
                nextState: { phase: "stopped" },
                actions: [{ type: "CLEANUP" }],
            }

        default:
            throw event satisfies never;
    }
};
