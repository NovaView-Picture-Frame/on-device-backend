import { PassThrough, type Readable } from "node:stream";
import fs from "node:fs/promises";
import sharp from "sharp";
import type { UUID } from "node:crypto";

import { geocoding, saveStream, insertAndLink } from "./effects";
import { config, paths } from "../../../config";
import { getMetadata, resizeToCover, resizeToInside } from "./render";
import { extractHashAndMetadata } from "./inspect";
import { notifyImagesChanged } from "../../carousel";
import { ignoreErrorCodes } from "../../../utils/ignoreErrorCodes";

interface Tasks {
    readonly lookupPlace: ReturnType<typeof geocoding>;
    readonly saveOriginal: ReturnType<typeof saveStream>;
    readonly crop: Promise<Parameters<typeof insertAndLink>[0]["extractRegion"]>;
    readonly optimize: ReturnType<typeof resizeToInside>;
    readonly persist: ReturnType<typeof insertAndLink>;
}

export const uploadTasksById = new Map<UUID, Tasks>();

export const uploadImage = (input: {
    taskId: UUID;
    stream: Readable;
    signal: AbortSignal;
}) => {
    const { taskId: id, stream, signal } = input;

    const originalTmp = `${paths.originals._tmp}/${id}`;
    const croppedTmp = `${paths.cropped._tmp}/${id}`;
    const optimizedTmp = `${paths.optimized._tmp}/${id}`;

    const teeForSharp = new PassThrough();
    const teeForFS = new PassThrough();
    stream.pipe(teeForSharp);
    stream.pipe(teeForFS);

    const transform = sharp();
    teeForSharp.pipe(transform);

    const sharpMetadata = getMetadata(transform.clone(), signal);
    const saveOriginal = saveStream({ stream: teeForFS, path: originalTmp, signal });
    const hashAndMetadata = Promise.all([sharpMetadata, saveOriginal]).then(
        ([meta, { path, size }]) => extractHashAndMetadata({ path, size, meta }),
    );

    const lookupPlace = hashAndMetadata.then(({ metadata: { GPSLatitude, GPSLongitude } }) => {
        if (GPSLatitude === undefined || GPSLongitude === undefined) return null;
        return geocoding({ lat: GPSLatitude, lng: GPSLongitude, signal });
    });

    const crop = Promise.all([
        sharpMetadata,
        resizeToCover({ sharpInstance: transform.clone(), path: croppedTmp, signal }),
    ]).then(([metadata, coverOutput]) => {
        const scale = Math.max(
            config.device.screen.width / metadata.width,
            config.device.screen.height / metadata.height,
        );

        return {
            left: Math.abs(coverOutput.cropOffsetLeft ?? 0),
            top: Math.abs(coverOutput.cropOffsetTop ?? 0),
            width: Math.round(metadata.width * scale),
            height: Math.round(metadata.height * scale),
        };
    });

    const optimize = resizeToInside({
        sharpInstance: transform.clone(),
        path: optimizedTmp,
        signal,
    });

    const persist = Promise.all([hashAndMetadata, lookupPlace, crop, optimize, saveOriginal]).then(
        ([{ hash, metadata }, place, extractRegion]) => insertAndLink({
            originalTmp,
            croppedTmp,
            optimizedTmp,
            hash,
            metadata,
            place,
            extractRegion,
        })
    );

    persist.then(() => {
        try {
            notifyImagesChanged();
        } catch (err) {
            console.error("Error notifying images changed:", err);
        };
    });

    const tasks = { lookupPlace, saveOriginal, crop, optimize, persist };
    uploadTasksById.set(id, tasks);

    Promise.allSettled(Object.values(tasks)).finally(async () => {
        setTimeout(() => uploadTasksById.delete(id), config.services.tasks_results_ttl_ms);

        await Promise.all(ignoreErrorCodes(
            [originalTmp, croppedTmp, optimizedTmp].map(path => fs.unlink(path)),
            "ENOENT",
        ));
    });

    return hashAndMetadata;
};
