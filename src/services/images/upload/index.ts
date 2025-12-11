import { PassThrough, type Readable } from 'node:stream';
import fs from 'node:fs/promises';
import sharp from 'sharp';
import type { UUID } from 'node:crypto';

import {
    geocoding,
    saveStream,
    insertAndMove,
} from './persist';
import { appConfig, paths } from '../../../config';
import {
    getMetadata,
    resizeToCover,
    resizeToInside,
} from './processor';
import { extractHashAndMetadata } from './inspect';
import { onImagesChanged } from '../carousel';
import { ignoreErrorCodes } from '../../../utils/ignoreErrorCodes';

export { InvalidBufferError } from './errors';

export const tasksMap = new Map<UUID, {
    readonly lookupPlace: ReturnType<typeof geocoding>;
    readonly saveOriginal: ReturnType<typeof saveStream>;
    readonly crop: Promise<
        Parameters<typeof insertAndMove>[0]['extractRegion']
    >;
	readonly optimize: ReturnType<typeof resizeToInside>;
    readonly persist: ReturnType<typeof insertAndMove>;
}>();

export const uploadProcessor = (input: {
    id: UUID;
    stream: Readable;
    signal: AbortSignal;
}) => {
	const originalTmp = `${paths.originals._tmp}/${input.id}`;
	const croppedTmp = `${paths.cropped._tmp}/${input.id}`;
	const optimizedTmp = `${paths.optimized._tmp}/${input.id}`;

    const teeForSharp = new PassThrough();
    const teeForFS = new PassThrough();
    input.stream.pipe(teeForSharp);
    input.stream.pipe(teeForFS);

    const transform = sharp();
    teeForSharp.pipe(transform);

    const sharpMetadata = getMetadata(transform.clone(), input.signal);
    const saveOriginal = saveStream({
        stream: teeForFS,
        path: originalTmp,
        signal: input.signal,
    });
    const hashAndMetadata = Promise.all([sharpMetadata, saveOriginal])
        .then(([meta, { path, size }]) => extractHashAndMetadata({
            path,
            size,
            meta,
        }));

    const lookupPlace = hashAndMetadata.then(
        ({ metadata: { GPSLatitude, GPSLongitude } }) => {
            if (GPSLatitude === undefined || GPSLongitude === undefined) return null;
            return geocoding({
                lat: GPSLatitude,
                long: GPSLongitude,
                signal: input.signal,
            }); 
        }
    );

    const crop = Promise.all([
        sharpMetadata,
        resizeToCover({
            sharpInstance: transform.clone(),
            path: croppedTmp,
            signal: input.signal,
        })
    ]).then(([metadata, coverOutput]) => {
        const scale = Math.max( 
            appConfig.device.screen.width / metadata.width,
            appConfig.device.screen.height / metadata.height,
        );

        return {
            left: Math.abs(coverOutput.cropOffsetLeft ?? 0),
            top: Math.abs(coverOutput.cropOffsetTop ?? 0),
            width: Math.round(metadata.width * scale),
            height: Math.round(metadata.height * scale),
        }
    });

    const optimize = resizeToInside({
        sharpInstance: transform.clone(),
        path: optimizedTmp,
        signal: input.signal,
    });

    const persist = Promise.all([
        hashAndMetadata,
        lookupPlace,
        crop,
        optimize,
        saveOriginal,
    ]).then(async ([{ hash, metadata }, place, extractRegion]) => {
        const id = await insertAndMove({
            originalTmp,
            croppedTmp,
            optimizedTmp,
            hash,
            metadata,
            place,
            extractRegion,
        });
        onImagesChanged();

        return id;
    });

    const tasks = {
        lookupPlace,
        saveOriginal,
        crop,
        optimize,
        persist,
    };
    tasksMap.set(input.id, tasks);

    Promise.allSettled(Object.values(tasks)).finally(async () => {
        setTimeout(
            () => tasksMap.delete(input.id),
            appConfig.runtime.tasks_results_ttl_ms
        );

        await Promise.all(ignoreErrorCodes(
            [originalTmp, croppedTmp, optimizedTmp].map(fs.unlink),
            'ENOENT',
        ));
    });

    return hashAndMetadata;
}
