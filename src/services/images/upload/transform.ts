import type { Sharp } from 'sharp';

import { InvalidBufferError } from './errors';
import config from '../../../config';

class StreamAbortedError extends Error {}

const abortableSharp = async <T>(
    sharpInstance: Sharp,
    signal: AbortSignal,
    run: (sharp: Sharp) => Promise<T>
) => {
    signal.throwIfAborted();

    const { promise, resolve, reject } = Promise.withResolvers<T>();
    const onAbort = () => {
        reject(new StreamAbortedError());
        sharpInstance.destroy();
    }

    signal.addEventListener('abort', onAbort, { once: true });
    run(sharpInstance).then(resolve, reject);

    return await promise
        .catch(err => {
            if (err instanceof StreamAbortedError) throw err;
            throw new InvalidBufferError();
        })
        .finally(() => signal.removeEventListener('abort', onAbort));
}

export const getMetadata = async (sharpInstance: Sharp, signal: AbortSignal) => abortableSharp(
    sharpInstance,
    signal,
    sharp => sharp.metadata(),
);

export const resizeToCover = async (
    sharpInstance: Sharp,
    path: string,
    signal: AbortSignal,
) => abortableSharp(
    sharpInstance,
    signal,
    sharp => sharp
        .resize(config.screenWidth, config.screenHeight, {
            fit: 'cover',
            position: 'entropy',
        })
        .keepIccProfile()
        .png()
        .toFile(path)
);

export const resizeToInside = async (
    sharpInstance: Sharp,
    path: string,
    signal: AbortSignal,
) => abortableSharp(
    sharpInstance,
    signal,
    sharp => sharp
        .resize(config.previewMaxWidth, config.previewMaxHeight, {
            fit: 'inside',
            withoutEnlargement: true,
        })
        .keepIccProfile()
        .avif()
        .toFile(path)
);
