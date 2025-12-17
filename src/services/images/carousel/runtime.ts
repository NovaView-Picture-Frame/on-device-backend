import { randomBytes, type UUID } from "crypto";

import { appConfig } from "../../../config";
import { buildScheduleMessage } from "./buildSchedule";
import { reducer } from "./reducer";
import type { State, Event, Action } from "./types";
import type { Order, OrderSwitchMode, ScheduleMessage } from "../../../models/carousel";

interface Listener {
    (message: ScheduleMessage): void;
}

const listeners = new Map<UUID, Listener>();

let state: State = {
    phase: "idle",
    order: appConfig.services.carousel.default_order,
};

const generateSeed = () => randomBytes(32);

const emit = (listener: Listener, message: ScheduleMessage) => {
    try {
        listener(message);
    } catch (err) {
        console.error("Carousel listener error:", err);
    }
};

const sendSchedule = (handledAt: Date, action: Action) => {
    if (state.phase !== "running")
        throw new Error("Unexpected action: running in non-running state.");

    const message = buildScheduleMessage(state, handledAt);

    switch (action.type) {
        case "SEND_TO_ONE": {
            const listener = listeners.get(action.id);
            if (!listener) throw new Error(`No listener found for id: ${action.id}`);

            emit(listener, message);
            break;
        }

        case "BROADCAST":
            for (const listener of listeners.values()) emit(listener, message);
            break;
    }
};

const dispatch = (event: Event) => {
    const handledAt = new Date();

    const { nextState, action } = reducer({ state, event, handledAt });

    state = nextState;
    if (action) sendSchedule(handledAt, action);
};

export const activate = () => dispatch(
    state.order === "random"
        ? { type: "ACTIVATE", order: "random", seed: generateSeed() }
        : { type: "ACTIVATE", order: state.order },
);

export const deactivate = () => dispatch({ type: "DEACTIVATE" });

export const requestSchedule = (id: UUID) => dispatch({ type: "REQUEST_SCHEDULE", id });

export const switchOrder = (order: Order, mode: OrderSwitchMode) => {
    if (state.phase === "idle") {
        dispatch({ type: "SET_ORDER", order });
        return;
    }

    dispatch(
        order === "random"
            ? { type: "SWITCH_ORDER", mode, order, seed: generateSeed()}
            : { type: "SWITCH_ORDER", mode, order },
    );
};

export const onImagesChanged = () => dispatch({ type: "IMAGES_CHANGED" });

export const handleConnected = (id: UUID, listener: Listener) => {
    listeners.set(id, listener);

    if (state.phase === "idle") {
        activate();
        console.log("Carousel Activated");
    }
    console.log("Listener added: ", id);

    return () => handleClosed(id, listener);
};

export const handleClosed = (id: UUID, listener: Listener) => {
    if (listener !== listeners.get(id)) return;

    listeners.delete(id);
    console.log("Listener removed: ", id);

    if (listeners.size !== 0) return;
    deactivate();
    console.log("Carousel Deactivated");
};
