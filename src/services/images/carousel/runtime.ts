import { randomBytes, type UUID } from 'crypto';
import type { WebSocket } from 'ws';

import { appConfig } from '../../../config';
import { initialState } from './types';
import { buildScheduleMessage } from './buildSchedule';
import { reducer } from './reducer';
import type { State, Event, Action } from './types';
import type { Order } from '../../../models/carousel';

let globalState: State = initialState;
const clientsMap = new Map<UUID, WebSocket>();

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
            const ws = clientsMap.get(action.deviceId);
            if (!ws) throw new Error(
                `No WebSocket found for deviceId: ${action.deviceId}`
            );

            send(ws, text);
            break;

        case 'BROADCAST':
            for (const ws of clientsMap.values()) send(ws, text);
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
    deviceId: UUID,
    now: Date,
}): Event => {
    if (input.state.phase === 'idle') {
        if (appConfig.services.carousel.default_order === 'random') return {
            type: 'CLIENT_CONNECTED',
            now: input.now,
            deviceId: input.deviceId,
            ...buildRandomOrder(),
        };

        return {
            type: 'CLIENT_CONNECTED',
            now: input.now,
            deviceId: input.deviceId,
            order: appConfig.services.carousel.default_order ,
        };
    }

    if (input.state.order === 'random') return {
        type: 'CLIENT_CONNECTED',
        now: input.now,
        deviceId: input.deviceId,
        order: 'random',
        seed: input.state.seed,
    };

    return {
        type: 'CLIENT_CONNECTED',
        now: input.now,
        deviceId: input.deviceId,
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

export const handleConnected = (deviceId: UUID, ws: WebSocket) => {
    clientsMap.set(deviceId, ws);
    dispatchEvent((state, now) => buildClientConnectedEvent({
        state,
        deviceId,
        now,
    }))
}

export const handleClosed = (deviceId: UUID, ws: WebSocket) => {
    if (ws !== clientsMap.get(deviceId)) return;

    clientsMap.delete(deviceId);
    if (clientsMap.size === 0) globalState = initialState;
}

export const requestSchedule = (deviceId: UUID) =>
    dispatchEvent((_, now) => ({
        type: 'REQUEST_SCHEDULE',
        now,
        deviceId,
    }));

export const switchOrder = (order: Order) =>
    dispatchEvent((_, now) => buildSwitchOrderEvent(order, now));

export const onImagesChanged = () =>
    dispatchEvent((_, now) => ({
        type: 'IMAGES_CHANGED',
        now,
    }));
