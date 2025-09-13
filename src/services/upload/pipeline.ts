import { pipeline } from 'node:stream/promises';
import { createWriteStream } from 'node:fs';
import fs from 'fs/promises';
import type { Readable } from "node:stream";
import type { Sharp, Metadata, OutputInfo } from 'sharp';

import { InvalidBufferError } from '.';
import config from '../../utils/config';
import { createHashTransformer } from '../transformers';
import { upsert } from '../../repositories/images';
import ignoreErrorCodes from '../../utils/ignoreErrorCodes';
import type { ExtractRegion } from '../../repositories/images';

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

export const saveStream = (
    stream: Readable,
    path: string,
    signal: AbortSignal
) => pipeline(
    stream,
    createWriteStream(path),
    { signal }
);

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

export const insertAndMove = async (input: {
    originalTmp: string;
    croppedTmp: string;
    optimizedTmp: string;
    hash: Awaited<ReturnType<typeof createHashTransformer>['hash']>;
    cropResult: ExtractRegion;
}) => {
    const { id, created } = upsert({ hash: input.hash, ...input.cropResult });
    if (created) {
        const moves: [string, string][] = [
            [input.originalTmp, `${config.paths.originals._base}/${id}`],
            [input.croppedTmp, `${config.paths.cropped._base}/${id}`],
            [input.optimizedTmp, `${config.paths.optimized._base}/${id}`],
        ];

        await Promise.all(
            ignoreErrorCodes(moves.map(move => fs.link(...move)),
            'EEXIST'
        ));
    }

    return id;
}
