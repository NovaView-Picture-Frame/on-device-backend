import type { UUID } from 'crypto';

import type { Order, OrderSwitchMode } from '../../../models/carousel';

type OrderOption =
    | {
        order: Extract<Order, 'random'>;
        seed: Buffer;
    }
    | {
        order: Exclude<Order, 'random'>;
        seed?: never;
    };

interface IdleState {
    phase: 'idle';
    order: Order;
}

type RunningState = {
    phase: 'running';
    startTime: Date;
} & OrderOption;

export type State = IdleState | RunningState;

type ActivateEvent = {
    type: 'ACTIVATE';
} & OrderOption;

interface DeactivateEvent {
    type: 'DEACTIVATE';
}

interface RequestScheduleEvent {
    type: 'REQUEST_SCHEDULE';
    deviceId: UUID;
}

interface SetOrderEvent {
    type: 'SET_ORDER';
    order: Order;
}

type SwitchOrderEvent = {
    type: 'SWITCH_ORDER';
    mode: OrderSwitchMode;
} & OrderOption;

interface ImagesChangedEvent {
    type: 'IMAGES_CHANGED';
}

export type Event =
    | ActivateEvent
    | DeactivateEvent
    | RequestScheduleEvent
    | SetOrderEvent
    | SwitchOrderEvent
    | ImagesChangedEvent;

interface SendToOneAction {
    type: 'SEND_TO_ONE';
    deviceId: UUID;
}

interface BroadcastAction {
    type: 'BROADCAST';
}

export type Action = SendToOneAction | BroadcastAction;
