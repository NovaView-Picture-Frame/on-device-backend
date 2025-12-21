import { config } from "../../../config";
import { listSlotImages } from "./listSlotImages";
import { listSlots } from "./listSlots";

import type { NewSchedule } from "../../../models/carousel";
import type { State } from "../schedule/types";

const getStartIndex = (now: Date, startTime: Date) => {
    const elapsed = now.getTime() - startTime.getTime();
    if (elapsed < 0) throw new Error("Invalid time: now is before startTime.");

    return ~~(elapsed / config.services.carousel.default_interval_ms);
};

export const buildScheduleMessage = (input: {
    state: Extract<State, { phase: "running" }>,
    now: Date,
    windowSize: number,
}): NewSchedule => {
    const { state, now, windowSize } = input;
    const { startTime } = state;
    const startIndex = getStartIndex(now, startTime);

    const baseInput = {
        images: listSlotImages(state.order),
        startTime,
        start: startIndex,
        length: windowSize,
    };

    const slots = state.order === "random"
        ? listSlots({
            ...baseInput,
            random: true,
            seed: state.seed,
        })
        : listSlots({
            ...baseInput,
            random: false,
        });

    return {
        type: "newSchedule",
        acceptableDelay: config.services.carousel.acceptable_delay_ms,
        slots,
    };
};
