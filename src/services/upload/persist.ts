import { pipeline } from 'node:stream/promises';
import { createWriteStream } from 'node:fs';
import fs from 'fs/promises';
import { z } from 'zod';
import type { Readable } from "node:stream";

import { upsert } from '../../repositories/images';
import config from '../../utils/config';
import ignoreErrorCodes from '../../utils/ignoreErrorCodes';
import type { ExtractRegion } from '../../repositories/images';

const placeSchema = z.object({
    place_id: z.number(),
    name: z.string(),
    addresstype: z.string(),
    display_name: z.string(),
});

export type Place = z.infer<typeof placeSchema>;

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

    const place = placeSchema.safeParse(await res.json());
    if (!place.success) return null;
    return place.data;
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
    hash: Buffer;
    exif: Record<string, string>;
    place: Place | null;
    cropResult: ExtractRegion;
}) => {
    const { id, created } = upsert({
        hash: input.hash,
        exif: input.exif,
        place: input.place,
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
