import { randomUUID } from 'node:crypto';
import { PassThrough } from 'node:stream';
import fs from 'fs/promises';
import sharp from 'sharp';
import type { Readable } from 'node:stream';

import {
    getMetadata,
    saveStream,
    resizeToCover,
    resizeToInside,
    insertAndMove,
} from './pipeline';
import config from '../../utils/config';
import { createHashTransformer } from '../transformers';
import ignoreErrorCodes from '../../utils/ignoreErrorCodes';

export class InvalidBufferError extends Error {}

export const tasksMap = new Map<string, {
    saveOriginal: ReturnType<typeof saveStream>,
    crop: Promise<
        Parameters<typeof insertAndMove>[0]['cropResult']
    >,
	optimize: ReturnType<typeof resizeToInside>,
    persist: ReturnType<typeof insertAndMove>,
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
    const saveOriginal = saveStream(teeForFS, originalTmp, signal);
    const crop = Promise.all([metadata, resizeToCover(transformer, croppedTmp, signal)])
        .then(([metadata, coverOutput]) => {
            const scale = Math.max( 
                config.screenWidth / metadata.width,
                config.screenHeight / metadata.height
            );

            return {
                extract_left: Math.abs(coverOutput.cropOffsetLeft ?? 0),
                extract_top: Math.abs(coverOutput.cropOffsetTop ?? 0),
                extract_width: Math.round(metadata.width * scale),
                extract_height: Math.round(metadata.height * scale),
            };
        });

    const optimize = resizeToInside(transformer.clone(), optimizedTmp, signal);
    const persist = Promise.all([hash, saveOriginal, crop, optimize])
        .then(([hash, _, cropResult]) => {
            return insertAndMove({
                originalTmp,
                croppedTmp,
                optimizedTmp,
                hash,
                cropResult,
            });
        });

    Promise.allSettled([persist]).finally(async () => {
        setTimeout(() => tasksMap.delete(id), config.tasksResultsTTL);

        await Promise.all(ignoreErrorCodes(
            [originalTmp, croppedTmp, optimizedTmp].map(fs.unlink),
            'ENOENT'
        ));
    });

    tasksMap.set(id, {
        saveOriginal,
        crop,
        optimize,
        persist,
    });

    return { hash, metadata };
}
