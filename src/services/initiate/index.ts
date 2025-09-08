import fs from 'fs/promises';
import { Writable } from 'node:stream';
import sharp from 'sharp';
import type { ReadableStream } from 'node:stream/web';

import { getMetadataAndResizeToCover, saveStream, resizeToInside } from './pipeline';
import config from '../../utils/config';
import ignoreErrorCodes from '../../utils/ignoreErrorCodes';

export class InvalidBufferError extends Error {}

export const tasksMap = new Map<string, {
	crop: ReturnType<typeof getMetadataAndResizeToCover>['resizeResult'],
	saveOriginal: ReturnType<typeof saveStream>,
	optimize: ReturnType<typeof resizeToInside>,
}>();

export const initiate = async (
    stream: ReadableStream<Uint8Array>,
    id: string,
    signal: AbortSignal
) => {
	const originalTmp = `${config.paths.originals._tmp}/${id}`;
	const croppedTmp = `${config.paths.cropped._tmp}/${id}`;
	const optimizedTmp = `${config.paths.optimized._tmp}/${id}`;

    const cleanup = () => Promise.all(ignoreErrorCodes(
        [originalTmp, croppedTmp, optimizedTmp].map(fs.unlink),
        'ENOENT'
    ));

	const [forSharp, forFS] = stream.tee();
	const cropTransformer = sharp();
    const optimizeTransformer = cropTransformer.clone();

    const pump = forSharp.pipeTo(Writable.toWeb(cropTransformer), { signal })
    const { metadata, resizeResult } = getMetadataAndResizeToCover(
        cropTransformer,
        croppedTmp
    );

	const tasks = {
		crop: resizeResult,
		saveOriginal: saveStream(forFS, originalTmp, signal),
		optimize: resizeToInside(optimizeTransformer, optimizedTmp),
	};
	tasksMap.set(id, tasks);

    Promise.all([pump, ...Object.values(tasks)])
        .catch(async () => {
            cropTransformer.destroy();
            optimizeTransformer.destroy();
            await cleanup();
        })
        .finally(() =>
            setTimeout(() => tasksMap.delete(id), 10 * 60 * 1000)
        );

    return await metadata.catch(() => {
        throw new InvalidBufferError();
    });
}
