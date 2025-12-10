import type { UUID } from 'crypto';

import type { Order } from '../../../models/carousel';

type OrderOption =
    | { order: 'random'; seed: Buffer }
    | { order: Exclude<Order, 'random'>; seed?: never };

type IdleState = { phase: 'idle' };

export type RunningState = {
    phase: 'running';
    startTime: Date;
} & OrderOption;

export type State = IdleState | RunningState;

export const initialState: State = { phase: 'idle' };

type ClientConnectedEvent = {
    type: 'CLIENT_CONNECTED';
    now: Date;
    deviceId: UUID;
} & OrderOption;

type RequestScheduleEvent = {
    type: 'REQUEST_SCHEDULE';
    now: Date;
    deviceId: UUID;
};

type SwitchOrderEvent = {
    type: 'SWITCH_ORDER';
    now: Date;
} & OrderOption;

type ImagesChangedEvent = {
    type: 'IMAGES_CHANGED';
    now: Date;
};

export type Event =
    | ClientConnectedEvent
    | RequestScheduleEvent
    | SwitchOrderEvent
    | ImagesChangedEvent;

type SendToOneAction = {
    type: 'SEND_TO_ONE';
    now: Date;
    deviceId: UUID;
};

type BroadcastAction = {
    type: 'BROADCAST';
    now: Date;
};

export type Action = SendToOneAction | BroadcastAction;
