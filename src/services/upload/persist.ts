import { pipeline } from 'node:stream/promises';
import { createWriteStream } from 'node:fs';
import fs from 'fs/promises';
import type { Readable } from "node:stream";

import { placeSchema } from '../../models/image';
import { upsert } from '../../repositories/images';
import config from '../../utils/config';
import ignoreErrorCodes from '../../utils/ignoreErrorCodes';

export const geocoding = async (lat: number, lon: number) => {
    const baseUrl = 'https://nominatim.openstreetmap.org/reverse';
    const params = new URLSearchParams({
        lat: String(lat),
        lon: String(lon),
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

    const resData = await res.json();
    const place = placeSchema.safeParse(resData);
    return place.success ? place.data : null;
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

export const insertAndMove = async (input: {
    originalTmp: string;
    croppedTmp: string;
    optimizedTmp: string;
    hash: Parameters<typeof upsert>[0]['hash'];
    cropResult: Parameters<typeof upsert>[0]['extractRegion'];
    exif: Parameters<typeof upsert>[0]['exif'];
    place: Parameters<typeof upsert>[0]['place'];
}) => {
    const { id, created } = upsert({
        hash: input.hash,
        extractRegion: input.cropResult,
        exif: input.exif,
        place: input.place,
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
