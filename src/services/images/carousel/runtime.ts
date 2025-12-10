import { randomBytes } from 'crypto';
import type { WebSocket } from 'ws';

import { config } from '../../../config.js';
import { initialState } from './types';
import { buildScheduleMessage } from './buildSchedule';
import { reducer } from './reducer';
import type { State, Event, Action } from './types';
import type { Order } from '../../../models/carousel';

let globalState: State = initialState;
const clients = new Set<WebSocket>();

const send = (ws: WebSocket, text: string) => {
    if (ws.readyState !== ws.OPEN) return;

    ws.send(text);
}

const dispatchMessage = (action?: Action) => {
    if (!action) return;
    if (globalState.phase !== 'running') {
        throw new Error("Unexpected action: running in non-running state.");
    }

    const message = buildScheduleMessage(globalState, action.now);
    const text = JSON.stringify(message);

    switch (action.type) {
        case 'SEND_TO_ONE':
            send(action.ws, text);
            break;

        case 'BROADCAST':
            for (const ws of clients) send(ws, text);
            break;
    }
}

const dispatchEvent = (
    buildEvent: (state: State, now: Date) => Event
) => {
    const event = buildEvent(globalState, new Date());
    const { nextState, action } = reducer(globalState, event);
    globalState = nextState;
    dispatchMessage(action);
}

const buildRandomOrder = (): { order: 'random'; seed: Buffer } => ({
    order: 'random',
    seed: randomBytes(32),
})

const buildClientConnectedEvent = (input: {
    state: State,
    ws: WebSocket,
    now: Date,
}): Event => {
    if (input.state.phase === 'idle') {
        if (config.carouselDefaultOrder === 'random') return {
            type: 'CLIENT_CONNECTED',
            now: input.now,
            ws: input.ws,
            ...buildRandomOrder(),
        };

        return {
            type: 'CLIENT_CONNECTED',
            now: input.now,
            ws: input.ws,
            order: config.carouselDefaultOrder,
        };
    }

    if (input.state.order === 'random') return {
        type: 'CLIENT_CONNECTED',
        now: input.now,
        ws: input.ws,
        order: 'random',
        seed: input.state.seed,
    };

    return {
        type: 'CLIENT_CONNECTED',
        now: input.now,
        ws: input.ws,
        order: input.state.order,
    };
}

const buildSwitchOrderEvent = (order: Order, now: Date): Event => {
    if (order === 'random') return {
        type: 'SWITCH_ORDER',
        now,
        ...buildRandomOrder(),
    };

    return {
        type: 'SWITCH_ORDER',
        now,
        order,
    };
}

export const handleConnected = (ws: WebSocket) => {
    clients.add(ws);

    dispatchEvent((state, now) => buildClientConnectedEvent({
        state,
        ws,
        now,
    }))
}

export const handleClosed = (ws: WebSocket) => {
    clients.delete(ws);

    if (clients.size === 0) globalState = initialState;
}

export const requestSchedule = (ws: WebSocket) =>
    dispatchEvent((_, now) => ({
        type: 'REQUEST_SCHEDULE',
        now,
        ws,
    }));

export const switchOrder = (order: Order) =>
    dispatchEvent((_, now) => buildSwitchOrderEvent(order, now));

export const onImagesChanged = () =>
    dispatchEvent((_, now) => ({
        type: 'IMAGES_CHANGED',
        now,
    }));
