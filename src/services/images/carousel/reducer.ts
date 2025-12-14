import type {
    State,
    Event,
    Action,
} from './types';

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
    switch (input.event.type) {
        case 'ACTIVATE':
            if (input.state.phase === 'running') return { nextState: input.state }

            return input.event.order === 'random'
                ? {
                    nextState: {
                        phase: 'running',
                        startTime: input.handledAt,
                        order: input.event.order,
                        seed: input.event.seed,
                    },
                } : {
                    nextState: {
                        phase: 'running',
                        startTime: input.handledAt,
                        order: input.event.order,
                    },
                }

        case 'DEACTIVATE': {
            if (input.state.phase === 'idle') return { nextState: input.state }

            return {
                nextState: {
                    phase: 'idle',
                    order: input.state.order,
                },
            }
        }

        case 'REQUEST_SCHEDULE':
            if (input.state.phase === 'idle') throw new Error(
                unexpectedEventMessage(input.event, input.state)
            );

            return {
                nextState: input.state,
                action: {
                    type: 'SEND_TO_ONE',
                    deviceId: input.event.deviceId,
                },
            }

        case 'SET_ORDER':
            if (input.state.phase !== 'idle') throw new Error(
                unexpectedEventMessage(input.event, input.state)
            );
            
            return {
                nextState: {
                    phase: input.state.phase,
                    order: input.event.order,
                },
            }

        case 'SWITCH_ORDER':
            if (input.state.phase === 'idle') throw new Error(
                unexpectedEventMessage(input.event, input.state)
            );

            return {
                nextState: input.event.order === 'random'
                    ? {
                        phase: 'running',
                        startTime: input.event.mode === 'restart'
                            ? input.handledAt
                            : input.state.startTime,
                        order: input.event.order,
                        seed: input.event.seed,
                    } : {
                        phase: 'running',
                        startTime: input.event.mode === 'restart'
                            ? input.handledAt
                            : input.state.startTime,
                        order: input.event.order,
                    },
                action: { type: 'BROADCAST' },
            }

        case 'IMAGES_CHANGED':
            if (input.state.phase === 'idle') return { nextState: input.state }

            return {
                nextState: input.state,
                action: { type: 'BROADCAST' },
            }
        }
}
