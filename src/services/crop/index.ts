import { randomUUID } from 'node:crypto';
import fs from 'fs/promises';

import { updateAndMove } from './persist';
import config from '../../config';
import { resizeAndExtract } from './transform';
import ignoreErrorCodes from '../../utils/ignoreErrorCodes';
import type { ExtractRegionRecord, ExtractOffsetUpdate } from '../../models/images';

const getTaskKey = (offset: ExtractOffsetUpdate) =>
        `${offset.id}-${offset.extractRegion.left}-${offset.extractRegion.top}`;

export const tasksMap = new Map<ReturnType<typeof randomUUID>, {
    key: ReturnType<typeof getTaskKey> | null;
    readonly tasks: {
        readonly crop: Promise<
            Parameters<typeof updateAndMove>[0]['extractRegion']
        >;
        readonly persist: ReturnType<typeof updateAndMove>;
    }
}>();

export const cropProcessor = (input: ExtractRegionRecord) => {
    const taskKey = getTaskKey(input);
    for (const [existingTaskId, existingEntry] of tasksMap.entries())
        if (existingEntry.key === taskKey) return existingTaskId;

    const croppedTmp = `${config.paths.cropped._tmp}/${input.id}`;

    const crop = resizeAndExtract(
        input,
        `${config.paths.originals._base}/${input.id}`,
        croppedTmp
    ).then(() => input.extractRegion);

    const persist = crop.then(() => updateAndMove(
        input,
        croppedTmp,
        `${config.paths.cropped._base}/${input.id}`
    ))

    const taskId = randomUUID();
    tasksMap.set(taskId, {
        key: taskKey,
        tasks: { crop, persist }
    });

    Promise.allSettled([persist]).finally(async () => {
        const entry = tasksMap.get(taskId);
        if (entry) entry.key = null;
        setTimeout(() => tasksMap.delete(taskId), config.tasksResultsTTL);

        await Promise.all([
            ignoreErrorCodes(fs.unlink(croppedTmp),
            'ENOENT')
        ]);
    });

    return taskId;
}
