import config from '../../../config';
import { getIDs } from './getIDs';
import { getSlots } from './getSlots';

import type { ScheduleMessage } from '../../../models/carousel';
import type { State } from './machine';

type RunningState = Extract<State, { phase: 'running' }>;

const getStartIndex = (
    now: Date,
    startTime: Date,
) => {
    const elapsed = now.getTime() - startTime.getTime();
    if (elapsed < 0) throw new Error(
        "Invalid time: now is before startTime."
    );

    return ~~(elapsed / config.carouselDefaultIntervalMs);
}

export const buildScheduleMessage = (
    state: RunningState,
    now: Date,
): ScheduleMessage => {
    const IDs = getIDs(state.order);
    const { startTime } = state;
    const startIndex = getStartIndex(now, startTime);

    return {
        type: 'newSchedule',
        acceptableDelay: 2000,
        slots: getSlots({
            IDs,
            startTime,
            start: startIndex,
            length: config.carouselWindowSize,
            random: state.order === 'random',
        }),
    }
}
