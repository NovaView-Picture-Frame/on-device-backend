import type {
    State,
    Event,
    Action,
} from './types';

const unexpectedEventMessage = (event: Event, state: State) =>
    `Unexpected event: ${event.type} in ${state.phase} state.`;

export const reducer = (
    state: State,
    event: Event,
): {
    nextState: State;
    action?: Action;
} => {
    switch (event.type) {
        case 'CLIENT_CONNECTED':
            if (state.phase === 'idle')
                if (event.order === 'random') return {
                    nextState: {
                        phase: 'running',
                        startTime: event.now,
                        order: 'random',
                        seed: event.seed,
                    },
                    action: {
                        type: 'SEND_TO_ONE',
                        now: event.now,
                        ws: event.ws,
                    },
                }
                else return {
                    nextState: {
                        phase: 'running',
                        startTime: event.now,
                        order: event.order,
                    },
                    action: {
                        type: 'SEND_TO_ONE',
                        now: event.now,
                        ws: event.ws,
                    },
                }

            return {
                nextState: state,
                action: {
                    type: 'SEND_TO_ONE',
                    now: event.now,
                    ws: event.ws,
                },
            }

        case 'REQUEST_SCHEDULE':
            if (state.phase === 'idle') throw new Error(
                unexpectedEventMessage(event, state)
            );

            return {
                nextState: state,
                action: {
                    type: 'SEND_TO_ONE',
                    now: event.now,
                    ws: event.ws,
                },
            }

        case 'SWITCH_ORDER':
            if (state.phase === 'idle') throw new Error(
                unexpectedEventMessage(event, state)
            );

            if (event.order === 'random') return {
                nextState: {
                    phase: 'running',
                    startTime: event.now,
                    order: 'random',
                    seed: event.seed,
                },
                action: {
                    type: 'BROADCAST',
                    now: event.now,
                },
            }
            else return {
                nextState: {
                    phase: 'running',
                    startTime: event.now,
                    order: event.order,
                },
                action: {
                    type: 'BROADCAST',
                    now: event.now,
                },
            }

        case 'IMAGES_CHANGED':
            if (state.phase === 'idle') return { nextState: state };

            return {
                nextState: state,
                action: {
                    type: 'BROADCAST',
                    now: event.now,
                },
            };
    }
}
