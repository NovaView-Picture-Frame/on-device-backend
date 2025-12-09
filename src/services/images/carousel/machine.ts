import type { WebSocket } from 'ws'; 

import { DEFAULT_ORDER, type Order } from '../../../models/carousel';

export type State =
    | { phase: 'idle'; }
    | {
        phase: 'running';
        order: Order;
        startTime: Date;
    };

export const initialState: State = { phase: 'idle' };

type Event =
    | {
        type: 'CLIENT_CONNECTED';
        now: Date;
        ws: WebSocket;
    }
    | {
        type: 'REQUEST_SCHEDULE';
        now: Date;
        ws: WebSocket;
    }
    | {
        type: 'SWITCH_ORDER';
        now: Date;
        order: Order;
    }
    | {
        type: 'IMAGES_CHANGED';
        now: Date;
    };

export type Action =
    | {
        type: 'SEND_TO_ONE';
        now: Date;
        ws: WebSocket;
    }
    | {
        type: 'BROADCAST';
        now: Date;
    };

export const reduceCarousel = (
    state: State,
    event: Event,
): {
    nextState: State;
    action?: Action
} => {
    switch (event.type) {
        case 'CLIENT_CONNECTED':
            if (state.phase === 'idle') return {
                nextState: {
                    phase: 'running',
                    order: DEFAULT_ORDER,
                    startTime: event.now,
                },
                action: {
                    type: 'SEND_TO_ONE',
                    now: event.now,
                    ws: event.ws,
                },
            };

            return {
                nextState: state,
                action: {
                    type: 'SEND_TO_ONE',
                    now: event.now,
                    ws: event.ws,
                },
            };

        case 'REQUEST_SCHEDULE':
            if (state.phase === 'idle') throw new Error(
                "Unexpected event: REQUEST_SCHEDULE in idle state."
            )

            return {
                nextState: state,
                action: {
                    type: 'SEND_TO_ONE',
                    now: event.now,
                    ws: event.ws,
                },
            };

        case 'SWITCH_ORDER':
            if (state.phase === 'idle') throw new Error(
                "Unexpected event: SWITCH_ORDER in idle state."
            )

            return {
                nextState: {
                    phase: 'running',
                    order: event.order,
                    startTime: event.now,
                },
                action: {
                    type: 'BROADCAST',
                    now: event.now,
                },
            };

        case 'IMAGES_CHANGED': {
            if (state.phase === 'idle') return {
                nextState: state
            };

            return {
                nextState: state,
                action: {
                    type: 'BROADCAST',
                    now: event.now,
                },
            };
        }
    }
}
