import { z } from "zod";

import type { ImageRecord } from "./images";

export const orderSchema = z.enum([
    "random",
    "createdAsc",
    "createdDesc",
    "takenAsc",
    "takenDesc",
]);

export type Order = z.infer<typeof orderSchema>;

export type OrderSwitchMode = "restart" | "continue";

export type SlotImage = Pick<ImageRecord, "id" | "revision">;

export interface Slot {
    id: string;
    startTime: Date;
    image: SlotImage;
}

export interface NewSchedule {
    type: "newSchedule";
    acceptableDelay: number;
    slots: Slot[];
}

export type CarouselServerMessage =
    | NewSchedule;

export const ClientMessageSchema = z.discriminatedUnion("type", [
    z.object({
        type: z.literal("requestSchedule"),
    }),
    z.object({
        type: z.literal("preloadComplete"),
        payload: z.object({
            id: z.string().nonempty(),
            timeStamp: z.coerce.date(),
        }),
    }),
]);
