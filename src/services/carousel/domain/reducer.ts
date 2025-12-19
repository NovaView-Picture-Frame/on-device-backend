import type { State, Event, Action } from "./types";

const unexpectedEventMessage = (event: Event, state: State) =>
    `Unexpected event: ${event.type} in ${state.phase} state.`;

export const reducer = (input: {
    state: State;
    event: Event;
    handledAt: Date;
}): {
    nextState: State;
    action?: Action;
} => {
    const { state, event, handledAt } = input;

    switch (event.type) {
        case "ACTIVATE":
            if (state.phase === "running") return { nextState: state };

            return event.order === "random"
                ? {
                    nextState: {
                        phase: "running",
                        startTime: handledAt,
                        order: event.order,
                        seed: event.seed,
                    },
                }
                : {
                    nextState: {
                        phase: "running",
                        startTime: handledAt,
                        order: event.order,
                    },
                };

        case "DEACTIVATE": {
            if (state.phase === "idle") return { nextState: state };

            return {
                nextState: {
                    phase: "idle",
                    order: state.order,
                },
            };
        }

        case "REQUEST_SCHEDULE":
            if (state.phase === "idle") throw new Error(unexpectedEventMessage(event, state));

            return {
                nextState: state,
                action: { type: "SEND_TO_ONE", id: event.id },
            };

        case "SET_ORDER":
            if (state.phase !== "idle") throw new Error(unexpectedEventMessage(event, state));

            return {
                nextState: {
                    phase: state.phase,
                    order: event.order,
                },
            };

        case "SWITCH_ORDER":
            if (state.phase === "idle") throw new Error(unexpectedEventMessage(event, state));

            return {
                nextState: event.order === "random"
                    ? {
                        phase: "running",
                        startTime: event.mode === "restart" ? handledAt : state.startTime,
                        order: event.order,
                        seed: event.seed,
                    }
                    : {
                        phase: "running",
                        startTime: event.mode === "restart" ? handledAt : state.startTime,
                        order: event.order,
                    },
                action: { type: "BROADCAST" },
            };

        case "IMAGES_CHANGED":
            if (state.phase === "idle") return { nextState: state };

            return {
                nextState: state,
                action: { type: "BROADCAST" },
            };

        default:
            throw event satisfies never;
    }
};
