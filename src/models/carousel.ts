import { z } from 'zod';

export const orderSchema = z.enum([
    'random',
    'createdAsc',
    'createdDesc',
    'takenAsc',
    'takenDesc',
]);

export type Order = z.infer<typeof orderSchema>;

export const orderSwitchModeSchema = z.enum([
    'restart',
    'continue',
]);

export type OrderSwitchMode = z.infer<typeof orderSwitchModeSchema>;

export interface Slot {
    id: string;
    startTime: Date;
    payload: {
        id: number;
    };
}

export interface ScheduleMessage {
    type: 'newSchedule';
    acceptableDelay: number;
    slots: Slot[];
}

export const ClientMessageSchema = z.discriminatedUnion('type', [
    z.object({
        type: z.literal('requestSchedule'),
    }),
    z.object({
        type: z.literal('preloadComplete'),
        payload: z.object({
            id: z.string().nonempty(),
            timeStamp: z.coerce.date(),
        }),
    }),
]);
