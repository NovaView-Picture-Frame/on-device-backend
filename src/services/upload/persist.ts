import { pipeline } from 'node:stream/promises';
import { createWriteStream } from 'node:fs';
import fs from 'fs/promises';
import type { Readable } from "node:stream";

import { createHashTransformer } from '../transformers';
import { upsert } from '../../repositories/images';
import config from '../../utils/config';
import ignoreErrorCodes from '../../utils/ignoreErrorCodes';
import type { ExtractRegion } from '../../repositories/images';

export const saveStream = (
    stream: Readable,
    path: string,
    signal: AbortSignal
) => pipeline(
    stream,
    createWriteStream(path),
    { signal }
);

export const insertAndMove = async (input: {
    originalTmp: string;
    croppedTmp: string;
    optimizedTmp: string;
    hash: Awaited<ReturnType<typeof createHashTransformer>['hash']>;
    exif: Record<string, string | undefined>;
    cropResult: ExtractRegion;
}) => {
    const { id, created } = upsert({
        hash: input.hash,
        exif: input.exif,
        ...input.cropResult
    });

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
