import WebSocket from 'ws';
import { randomBytes, type UUID } from 'crypto';

import { appConfig } from '../../../config';
import { buildScheduleMessage } from './buildSchedule';
import { reducer } from './reducer';
import type { State, Event, Action } from './types';
import type { Order, OrderSwitchMode } from '../../../models/carousel';

const clientsMap = new Map<UUID, WebSocket>();

let state: State = {
    phase: 'idle',
    order: appConfig.services.carousel.default_order,
}

const generateSeed = () => randomBytes(32);

const send = (ws: WebSocket, text: string) => {
    if (ws.readyState !== WebSocket.OPEN) return;
    ws.send(text);
}

const sendSchedule = (handledAt: Date, action: Action) => {
    if (state.phase !== 'running') throw new Error(
        "Unexpected action: running in non-running state."
    );

    const message = buildScheduleMessage(state, handledAt);
    const text = JSON.stringify(message);

    switch (action.type) {
        case 'SEND_TO_ONE': {
            const ws = clientsMap.get(action.deviceId);
            if (!ws) throw new Error(`No WebSocket found for deviceId: ${action.deviceId}`);

            send(ws, text);
            break;
        }

        case 'BROADCAST':
            for (const ws of clientsMap.values()) send(ws, text);
        break;
    }
}

const dispatchEvent = (event: Event) => {
    const handledAt = new Date();

    const { nextState, action } = reducer({
        state,
        event,
        handledAt,
    });

    state = nextState;
    action && sendSchedule(handledAt, action);
}

export const activate = () => dispatchEvent(
    state.order === 'random'
        ? {
            type: 'ACTIVATE',
            order: 'random',
            seed: generateSeed(),
        } : {
            type: 'ACTIVATE',
            order: state.order,
        }
);

export const deactivate = () => dispatchEvent({ type: 'DEACTIVATE' });

export const requestSchedule = (deviceId: UUID) => dispatchEvent({
    type: 'REQUEST_SCHEDULE',
    deviceId,
});

export const switchOrder = (order: Order, mode: OrderSwitchMode) => {
    if (state.phase === 'idle') {
        dispatchEvent({ type: 'SET_ORDER', order });
        return;
    }

    dispatchEvent(
        order === 'random'
            ? {
                type: 'SWITCH_ORDER',
                mode, order,
                seed: generateSeed(),
            } : {
                type: 'SWITCH_ORDER',
                mode, order,
            }
    );
};

export const onImagesChanged = () => dispatchEvent({ type: 'IMAGES_CHANGED' });

export const handleConnected = (deviceId: UUID, ws: WebSocket) => {
    clientsMap.set(deviceId, ws);

    if (state.phase === 'idle') {
        activate();
        console.log("WebSocket Activated")
    }

    console.log("WebSocket connected for device: ", deviceId);

    dispatchEvent({
        type: 'REQUEST_SCHEDULE',
        deviceId,
    });
}

export const handleClosed = (deviceId: UUID, ws: WebSocket) => {
    if (ws !== clientsMap.get(deviceId)) return;
    clientsMap.delete(deviceId);
    console.log("WebSocket closed for device: ", deviceId);

    if (clientsMap.size !== 0) return;
    deactivate();
    console.log("WebSocket Deactivated");
}
