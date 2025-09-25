import { randomUUID } from 'node:crypto';
import { PassThrough } from 'node:stream';
import fs from 'fs/promises';
import sharp from 'sharp';
import type { Readable } from 'node:stream';

import { geocoding, saveStream, insertAndMove } from './persist';
import config from '../../utils/config';
import { createHashTransformer } from '../transformers';
import { getMetadata, parseExifBuffer, convertDMSToDecimal, resizeToCover, resizeToInside } from './transform';
import ignoreErrorCodes from '../../utils/ignoreErrorCodes';

export class InvalidBufferError extends Error {}

export const tasksMap = new Map<string, {
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

    const { transform, hash } = createHashTransformer('sha256');
    const hashedStream = stream.pipe(transform);

    const teeForSharp = new PassThrough();
    const teeForFS = new PassThrough();
    hashedStream.pipe(teeForSharp);
    hashedStream.pipe(teeForFS);

    const transformer = sharp();
    teeForSharp.pipe(transformer);

    const metadata = getMetadata(transformer, signal);
    const parseExif = metadata.then(({ exif, format }) => exif
        ? parseExifBuffer(exif, format)
        : null
    );
    
    const lookupPlace = parseExif.then(exif => {
        if (
            !exif?.GPSLatitude ||
            !exif.GPSLatitudeRef ||
            !exif?.GPSLongitude ||
            !exif.GPSLongitudeRef
        ) return null;

        const lat = convertDMSToDecimal(exif.GPSLatitude, exif.GPSLatitudeRef);
        const lon = convertDMSToDecimal(exif.GPSLongitude, exif.GPSLongitudeRef);
        return geocoding(lat, lon);
    });

    const saveOriginal = saveStream(teeForFS, originalTmp, signal);
    const crop = Promise.all([metadata, resizeToCover(transformer, croppedTmp, signal)])
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

    const optimize = resizeToInside(transformer.clone(), optimizedTmp, signal);
    const persist = Promise.all([
        hash,
        parseExif,
        lookupPlace,
        saveOriginal,
        crop,
        optimize
    ]).then(([hash, exif, place, _, cropResult]) => insertAndMove({
        originalTmp,
        croppedTmp,
        optimizedTmp,
        hash,
        exif,
        place,
        cropResult,
    }));

    Promise.allSettled([persist]).finally(async () => {
        setTimeout(() => tasksMap.delete(id), config.tasksResultsTTL);

        await Promise.all(ignoreErrorCodes(
            [originalTmp, croppedTmp, optimizedTmp].map(fs.unlink),
            'ENOENT'
        ));
    });

    tasksMap.set(id, {
        lookupPlace,
        saveOriginal,
        crop,
        optimize,
        persist,
    });

    return { hash, metadata };
}
