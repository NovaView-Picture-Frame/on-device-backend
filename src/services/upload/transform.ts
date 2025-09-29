import type { Sharp, Metadata, OutputInfo } from 'sharp';

import { InvalidBufferError } from '.';
import config from "../../config";

class StreamAbortedError extends Error {}

export const getMetadata = async (sharpInstance: Sharp, signal: AbortSignal) => {
    signal.throwIfAborted();

    const { promise, resolve, reject } = Promise.withResolvers<Metadata>();
    const onAbort = () => {
        reject(new StreamAbortedError());
        sharpInstance.destroy();
    };

    signal.addEventListener('abort', onAbort, { once: true });
    sharpInstance.metadata().then(resolve, reject);

    return await promise
        .catch(err => {
            if (err instanceof StreamAbortedError) throw err;
            throw new InvalidBufferError();
        })
        .finally(() => signal.removeEventListener('abort', onAbort));
}

export const resizeToCover = async (
    sharpInstance: Sharp,
    path: string,
    signal: AbortSignal
) => {
    signal.throwIfAborted();

    const { promise, resolve, reject } = Promise.withResolvers<OutputInfo>();
    const onAbort = () => {
        reject(new StreamAbortedError());
        sharpInstance.destroy();
    };

    signal.addEventListener('abort', onAbort, { once: true });
    sharpInstance
        .resize(config.screenWidth, config.screenHeight, {
            fit: 'cover',
            position: 'entropy',
        })
        .png()
        .toFile(path)
        .then(resolve, reject);

    return await promise
        .catch(err => {
            if (err instanceof StreamAbortedError) throw err;
            throw new InvalidBufferError();
        })
        .finally(() => signal.removeEventListener('abort', onAbort));
}

export const resizeToInside = async (
    sharpInstance: Sharp,
    path: string,
    signal: AbortSignal
) => {
    signal.throwIfAborted();

    const { promise, resolve, reject } = Promise.withResolvers<OutputInfo>();
    const onAbort = () => {
        reject(new StreamAbortedError());
        sharpInstance.destroy();
    };

    signal.addEventListener('abort', onAbort, { once: true });
    sharpInstance
        .resize(config.previewMaxWidth, config.previewMaxHeight, {
            fit: 'inside',
            withoutEnlargement: true,
        })
        .avif()
        .toFile(path)
        .then(resolve, reject);

    return await promise
        .catch(err => {
            if (err instanceof StreamAbortedError) throw err;
            throw new InvalidBufferError();
        })
        .finally(() => signal.removeEventListener('abort', onAbort));
}
