import { config } from '../../../config';
import { getIDs } from './getIDs';
import { getSlots } from './getSlots';

import type { ScheduleMessage } from '../../../models/carousel';
import type { RunningState } from './types';

const getStartIndex = (now: Date, startTime: Date) => {
    const elapsed = now.getTime() - startTime.getTime();
    if (elapsed < 0) throw new Error(
        "Invalid time: now is before startTime.",
    );

    return ~~(elapsed / config.carouselDefaultIntervalMs);
};

export const buildScheduleMessage = (
    state: RunningState,
    now: Date,
): ScheduleMessage => {
    const IDs = getIDs(state.order);
    const { startTime } = state;
    const startIndex = getStartIndex(now, startTime);

    const baseInput = {
        IDs,
        startTime,
        start: startIndex,
        length: config.carouselWindowSize,
    };

    const slots = state.order === 'random'
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
        type: 'newSchedule',
        acceptableDelay: config.carouselAcceptableDelayMs,
        slots,
    };
};
