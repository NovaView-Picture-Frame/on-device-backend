import type { WebSocket } from 'ws';

import {
    createInitialState,
    reduceCarousel,
    type Action,
} from './machine';
import { buildScheduleMessage } from './buildSchedule';
import type { Order } from '../../../models/carousel';

let state = createInitialState();
const clients = new Set<WebSocket>();

const runAction = (action?: Action) => {
    if (!action) return;
    if (state.phase !== 'running') throw new Error(
        "Unexpected action: running in non-running state."
    )

    const message = buildScheduleMessage(state, action.now);
    const text = JSON.stringify(message);

    switch (action.type) {
        case 'SEND_TO_ONE':
            action.ws.readyState === action.ws.OPEN &&
                action.ws.send(text);

            break;

        case 'BROADCAST':
            for (const ws of clients) {
                ws.readyState === ws.OPEN &&
                    ws.send(text);
            }

            break;
    }
};

export const handleConnected = (ws: WebSocket) => {
    clients.add(ws);

    const { nextState, action } = reduceCarousel(state, {
        type: 'CLIENT_CONNECTED',
        now: new Date(),
        ws,
    });

    state = nextState;
    runAction(action);
};

export const handleClosed = (ws: WebSocket) =>
    clients.delete(ws);

export const requestSchedule = (ws: WebSocket) => {
    const { nextState, action } = reduceCarousel(state, {
        type: 'REQUEST_SCHEDULE',
        now: new Date(),
        ws,
    });

    state = nextState;
    runAction(action);
};

export const switchOrder = (order: Order) => {
    const { nextState, action } = reduceCarousel(state, {
        type: 'SWITCH_ORDER',
        now: new Date(),
        order,
    });

    state = nextState;
    runAction(action);
};

export const onImagesChanged = () => {
    const { nextState, action } = reduceCarousel(state, {
        type: 'IMAGES_CHANGED',
        now: new Date(),
    });

    state = nextState;
    runAction(action);
};
