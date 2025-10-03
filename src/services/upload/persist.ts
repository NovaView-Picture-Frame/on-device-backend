import { pipeline } from 'node:stream/promises';
import { createWriteStream } from 'node:fs';
import fs from 'fs/promises';
import type { Readable } from "node:stream";

import config from '../../config';
import { imageRecordSchema } from '../../models/images';
import { upsert } from '../../repositories/images';
import ignoreErrorCodes from '../../utils/ignoreErrorCodes';

export const geocoding = async (latitude: number, longitude: number) => {
    const baseUrl = 'https://nominatim.openstreetmap.org/reverse';
    const params = new URLSearchParams({
        lat: latitude.toString(),
        lon: longitude.toString(),
        zoom: '10',
        addressdetails: '0',
        format: 'jsonv2',
    });

    const res = await fetch(`${baseUrl}?${params.toString()}`, {
        headers: {
            'User-Agent': config.nominatimUserAgent,
            'Accept-Language': 'en',
        },
    });

    const { addresstype, display_name, ...rest } = await res.json()
    const place = imageRecordSchema.shape.place.safeParse({
        ...rest,
        type: addresstype,
        fullName: display_name,
    });
    return place.success ? place.data : null;
}

export const saveStream = async (
    stream: Readable,
    path: string,
    signal: AbortSignal
) => {
    const sink = createWriteStream(path);
    await pipeline(stream, sink, { signal });

    return {
        path,
        size: sink.bytesWritten
    };
};

export const insertAndMove = async (input: {
    originalTmp: string;
    croppedTmp: string;
    optimizedTmp: string;
    hash: Parameters<typeof upsert>[0]['hash'];
    extractRegion: Parameters<typeof upsert>[0]['extractRegion'];
    metadata: Parameters<typeof upsert>[0]['metadata'];
    place: Parameters<typeof upsert>[0]['place'];
}) => {
    const { id, created } = upsert(input);

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
