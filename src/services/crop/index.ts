import { randomUUID } from 'node:crypto';
import fs from 'fs/promises';

import { resizeAndExtract, updateAndMove } from './pipeline';
import config from '../../utils/config';
import ignoreErrorCodes from '../../utils/ignoreErrorCodes';
import type { ExtractOffsetWithID } from '../../repositories/images';

const getTaskKey = (offset: ExtractOffsetWithID):
    `${ExtractOffsetWithID['id']}-${ExtractOffsetWithID['extract_left']}-${ExtractOffsetWithID['extract_top']}` =>
        `${offset.id}-${offset.extract_left}-${offset.extract_top}`;

export const tasksMap = new Map<string, {
    key: ReturnType<typeof getTaskKey> | null;
    tasks: {
        crop: ReturnType<typeof resizeAndExtract>;
        persist: ReturnType<typeof updateAndMove>;
    }
}>();

export const cropProcessor = (input: ExtractOffsetWithID) => {
    const taskKey = getTaskKey(input);
    for (const [existingTaskId, existingEntry] of tasksMap.entries())
        if (existingEntry.key === taskKey) return existingTaskId;

    const croppedTmp = `${config.paths.cropped._tmp}/${input.id}`;

    const crop = resizeAndExtract(
        input,
        `${config.paths.originals._base}/${input.id}`,
        croppedTmp
    );

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
