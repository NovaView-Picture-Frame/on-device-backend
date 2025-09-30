import { randomUUID } from 'node:crypto';
import fs from 'fs/promises';

import { resizeAndExtract, updateAndMove } from './transform';
import config from '../../config';
import ignoreErrorCodes from '../../utils/ignoreErrorCodes';
import type { ExtractOffsetUpdate } from '../../models/images';

const getTaskKey = (offset: ExtractOffsetUpdate):
    `${ExtractOffsetUpdate['id']}-${ExtractOffsetUpdate['left']}-${ExtractOffsetUpdate['top']}` =>
        `${offset.id}-${offset.left}-${offset.top}`;

export const tasksMap = new Map<ReturnType<typeof randomUUID>, {
    key: ReturnType<typeof getTaskKey> | null;
    tasks: {
        readonly crop: ReturnType<typeof resizeAndExtract>;
        readonly persist: ReturnType<typeof updateAndMove>;
    }
}>();

export const cropProcessor = (input: ExtractOffsetUpdate) => {
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
