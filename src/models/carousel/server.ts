import type { ImageRecord } from "../images";

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

interface CarouselError {
    type: "error";
    message: string;
}

export type CarouselServerMessage = NewSchedule | CarouselError;
