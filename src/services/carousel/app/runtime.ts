import { randomBytes, type UUID } from "node:crypto";

import { config } from "../../../config";
import { buildScheduleMessage } from "./buildSchedule";
import { reducer } from "../domain/reducer";
import type { State, Event, Action } from "../domain/types";
import type { Order, OrderSwitchMode, NewSchedule } from "../../../models/carousel";

interface Listener {
    (message: NewSchedule): void;
}

const listeners = new Map<UUID, Listener>();

let state: State = {
    phase: "idle",
    order: config.services.carousel.default_order,
};

const pushSchedule = (listener: Listener, message: NewSchedule) => {
    try {
        listener(message);
    } catch (err) {
        console.error("Carousel listener error:", err);
    }
};

const dispatchSchedule = (handledAt: Date, action: Action) => {
    if (state.phase !== "running")
        throw new Error("Unexpected action: running in non-running state.");

    const message = buildScheduleMessage(state, handledAt);

    switch (action.type) {
        case "SEND_TO_ONE": {
            const listener = listeners.get(action.id);
            if (!listener) throw new Error(`No listener found for id: ${action.id}`);

            pushSchedule(listener, message);
            break;
        }

        case "BROADCAST":
            for (const listener of listeners.values()) pushSchedule(listener, message);
            break;

        default:
            action satisfies never;
    }
};

const dispatchEvent = (event: Event) => {
    const handledAt = new Date();

    const { nextState, action } = reducer({ state, event, handledAt });

    state = nextState;
    if (action) dispatchSchedule(handledAt, action);
};

const generateSeed = () => randomBytes(32);

export const activate = () => dispatchEvent(
    state.order === "random"
        ? { type: "ACTIVATE", order: "random", seed: generateSeed() }
        : { type: "ACTIVATE", order: state.order },
);

export const deactivate = () => dispatchEvent({ type: "DEACTIVATE" });

export const requestSchedule = (id: UUID) => dispatchEvent({ type: "REQUEST_SCHEDULE", id });

export const switchOrder = (order: Order, mode: OrderSwitchMode) => {
    if (state.phase === "idle") {
        dispatchEvent({ type: "SET_ORDER", order });
        return;
    }

    dispatchEvent(
        order === "random"
            ? { type: "SWITCH_ORDER", mode, order, seed: generateSeed()}
            : { type: "SWITCH_ORDER", mode, order },
    );
};

export const notifyImagesChanged = () => dispatchEvent({ type: "IMAGES_CHANGED" });

const unsubscribeSchedule = (id: UUID, listener: Listener) => {
    if (listener !== listeners.get(id)) return;

    listeners.delete(id);
    console.log("Listener removed: ", id);

    if (listeners.size !== 0) return;
    deactivate();
    console.log("Carousel Deactivated");
};

export const subscribeSchedule = (id: UUID, listener: Listener) => {
    listeners.set(id, listener);

    if (state.phase === "idle") {
        activate();
        console.log("Carousel Activated");
    }
    console.log("Listener added: ", id);

    return () => unsubscribeSchedule(id, listener);
};
