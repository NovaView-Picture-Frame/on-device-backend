import { randomUUID, type UUID } from "node:crypto";
import fs from "node:fs/promises";

import { updateAndMove } from "./effects";
import { config, paths } from "../../../config";
import { resizeAndExtract } from "./render";
import { notifyImagesChanged } from "../../carousel";
import { ignoreErrorCodes } from "../../../utils/ignoreErrorCodes";
import type { ExtractOffsetUpdate, ExtractRegionRecord } from "../../../models/images";

const getTaskKey = (offset: ExtractOffsetUpdate) =>
    `${offset.id}-${offset.extractRegion.left}-${offset.extractRegion.top}`;

interface Tasks {
    readonly crop: Promise<
        Parameters<typeof updateAndMove>[0]["record"]["extractRegion"]
    >;
    readonly persist: ReturnType<typeof updateAndMove>;
}

export const cropTasksById = new Map<UUID, {
    key: ReturnType<typeof getTaskKey> | null;
    readonly tasks: Tasks;
}>();

export const cropImage = (input: {
    current: ExtractRegionRecord;
    left: ExtractRegionRecord["extractRegion"]["left"];
    top: ExtractRegionRecord["extractRegion"]["top"];
}) => {
    const next = {
        id: input.current.id,
        extractRegion: {
            left: input.left,
            top: input.top,
        },
    };

    const taskKey = getTaskKey(next);
    for (const [existingTaskId, existingEntry] of cropTasksById.entries())
        if (existingEntry.key === taskKey) return existingTaskId;

    const taskId = randomUUID();
    const croppedTmp = `${paths.cropped._tmp}/${next.id}_${taskId}`;

    const crop = resizeAndExtract({
        record: next,
        src: `${paths.originals._base}/${next.id}`,
        dest: croppedTmp,
    }).then(() => next.extractRegion);

    const persist = crop.then(() =>
        updateAndMove({ record: next, croppedTmp, cropped: `${paths.cropped._base}/${next.id}` }),
    );

    persist.then(
        () => {
            try {
                notifyImagesChanged();
            } catch (err) {
                console.error("Error notifying images changed:", err);
            };
        },
        () => {},
    );

    const tasks = { crop, persist };
    cropTasksById.set(taskId, { key: taskKey, tasks});

    Promise.allSettled(Object.values(tasks)).finally(async () => {
        const entry = cropTasksById.get(taskId);
        if (entry) entry.key = null;
        setTimeout(() => cropTasksById.delete(taskId), config.services.tasks_results_ttl_ms);

        await ignoreErrorCodes(fs.unlink(croppedTmp), "ENOENT");
    });

    return taskId;
};
