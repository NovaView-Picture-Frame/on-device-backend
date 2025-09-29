import { randomUUID } from 'node:crypto';
import { PassThrough } from 'node:stream';
import fs from 'fs/promises';
import sharp from 'sharp';
import type { Readable } from 'node:stream';

import { geocoding, saveStream, insertAndMove } from './persist';
import config from '../../config';
import { getMetadata, resizeToCover, resizeToInside } from './transform';
import { extractHashAndExif } from './inspect';
import ignoreErrorCodes from '../../utils/ignoreErrorCodes';

export class InvalidBufferError extends Error {}

export const tasksMap = new Map<ReturnType<typeof randomUUID>, {
    readonly lookupPlace: ReturnType<typeof geocoding>,
    readonly saveOriginal: ReturnType<typeof saveStream>,
    readonly crop: Promise<
        Parameters<typeof insertAndMove>[0]['cropResult']
    >,
	readonly optimize: ReturnType<typeof resizeToInside>,
    readonly persist: ReturnType<typeof insertAndMove>,
}>();

export const uploadProcessor = (
    id: ReturnType<typeof randomUUID>,
    stream: Readable,
    signal: AbortSignal,
) => {
	const originalTmp = `${config.paths.originals._tmp}/${id}`;
	const croppedTmp = `${config.paths.cropped._tmp}/${id}`;
	const optimizedTmp = `${config.paths.optimized._tmp}/${id}`;

    const teeForSharp = new PassThrough();
    const teeForFS = new PassThrough();
    stream.pipe(teeForSharp);
    stream.pipe(teeForFS);

    const transform = sharp();
    teeForSharp.pipe(transform);

    const metadata = getMetadata(transform, signal);

    const saveOriginal = saveStream(teeForFS, originalTmp, signal);
    const extract = saveOriginal.then(extractHashAndExif);
    const hash = extract.then(({ hash }) => hash);
    const exif = extract.then(({ exif }) => exif);

    const lookupPlace = exif.then(exif => {
        if (
            exif?.GPSLatitude === undefined ||
            exif?.GPSLongitude === undefined
        ) return null;

        return geocoding(exif.GPSLatitude, exif.GPSLongitude);
    });

    const crop = Promise.all([metadata, resizeToCover(transform, croppedTmp, signal)])
        .then(([metadata, coverOutput]) => {
            const scale = Math.max( 
                config.screenWidth / metadata.width,
                config.screenHeight / metadata.height
            );

            return {
                left: Math.abs(coverOutput.cropOffsetLeft ?? 0),
                top: Math.abs(coverOutput.cropOffsetTop ?? 0),
                width: Math.round(metadata.width * scale),
                height: Math.round(metadata.height * scale),
            };
        });

    const optimize = resizeToInside(transform.clone(), optimizedTmp, signal);

    const persist = Promise.all([
        hash,
        exif,
        lookupPlace,
        crop,
        optimize,
        saveOriginal,
    ]).then(([hash, exif, place, cropResult]) => insertAndMove({
        originalTmp,
        croppedTmp,
        optimizedTmp,
        hash,
        exif,
        place,
        cropResult,
    }));

    const tasks = {
        lookupPlace,
        saveOriginal,
        crop,
        optimize,
        persist,
    }

    tasksMap.set(id, tasks);

    Promise.allSettled(Object.values(tasks)).finally(async () => {
        setTimeout(() => tasksMap.delete(id), config.tasksResultsTTL);

        await Promise.all(ignoreErrorCodes(
            [originalTmp, croppedTmp, optimizedTmp].map(fs.unlink),
            'ENOENT'
        ));
    });

    return { metadata, hash };
}
