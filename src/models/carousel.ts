import { z } from 'zod';

export const OrderSchema = z.enum([
    'random',
    'createdAsc',
    'createdDesc',
    'takenAsc',
    'takenDesc',
]);

export type Order = z.infer<typeof OrderSchema>;
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
