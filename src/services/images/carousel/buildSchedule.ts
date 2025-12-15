import { appConfig } from "../../../config";
import { getIds } from "./getIds";
import { getSlots } from "./getSlots";

import type { ScheduleMessage } from "../../../models/carousel";
import type { State } from "./types";

const getStartIndex = (now: Date, startTime: Date) => {
    const elapsed = now.getTime() - startTime.getTime();
    if (elapsed < 0) throw new Error("Invalid time: now is before startTime.");

    return ~~(elapsed / appConfig.services.carousel.default_interval_ms);
};

export const buildScheduleMessage = (
    state: Extract<State, { phase: "running" }>,
    now: Date,
): ScheduleMessage => {
    const { startTime } = state;
    const startIndex = getStartIndex(now, startTime);

    const baseInput = {
        ids: getIds(state.order),
        startTime,
        start: startIndex,
        length: appConfig.services.carousel.schedule_window_size,
    };

    const slots = state.order === "random"
        ? getSlots({
            ...baseInput,
            random: true,
            seed: state.seed,
        })
        : getSlots({
            ...baseInput,
            random: false,
        });

    return {
        type: "newSchedule",
        acceptableDelay: appConfig.services.carousel.acceptable_delay_ms,
        slots,
    };
};
