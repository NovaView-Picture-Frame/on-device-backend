import { createWriteStream } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import fs from 'node:fs/promises';
import { z } from 'zod';
import type { Readable } from 'node:stream';

import { appConfig, paths } from '../../../config';
import { imageRecordSchema } from '../../../models/images';
import { upsert } from '../../../repositories/images';
import { ignoreErrorCodes } from '../../../utils/ignoreErrorCodes';

type PlaceSchema = ReturnType<typeof imageRecordSchema.shape.place.unwrap>;

const nominatimSchema = z.object({
    name: z.string(),
    addresstype: z.string(),
    display_name: z.string(),
}).transform((raw): z.infer<PlaceSchema> => ({
    name: raw.name,
    type: raw.addresstype,
    fullName: raw.display_name,
}));

export const geocoding = async (input: {
    lat: number;
    long: number;
    signal: AbortSignal;
}) => {
    const baseUrl = 'https://nominatim.openstreetmap.org/reverse';
    const params = new URLSearchParams({
        lat: input.lat.toString(),
        lon: input.long.toString(),
        zoom: '10',
        addressdetails: '0',
        format: 'jsonv2',
    });

    const res = await fetch(`${baseUrl}?${params.toString()}`, {
        headers: {
            'User-Agent': appConfig.external.nominatim.user_agent,
            'Accept-Language': 'en',
        },
        signal: input.signal,
    });
    if (!res.ok) return null;

    const nominatimResult = nominatimSchema.safeParse(await res.json());
    if (!nominatimResult.success) return null;
    return nominatimResult.data;
}

export const saveStream = async (input: {
    stream: Readable,
    path: string,
    signal: AbortSignal,
}) => {
    const sink = createWriteStream(input.path);
    await pipeline(
        input.stream,
        sink,
        {
            signal: input.signal,
        });

    return {
        path: input.path,
        size: sink.bytesWritten,
    }
}

export const insertAndMove = async (input: {
    originalTmp: string,
    croppedTmp: string,
    optimizedTmp: string,
    hash: Parameters<typeof upsert>[0]['hash'];
    extractRegion: Parameters<typeof upsert>[0]['extractRegion'];
    metadata: Parameters<typeof upsert>[0]['metadata'];
    place: Parameters<typeof upsert>[0]['place'];
}) => {
    const { id, created } = upsert(input);

    if (created) {
        const moves: [string, string][] = [
            [input.originalTmp, `${paths.originals._base}/${id}`],
            [input.croppedTmp, `${paths.cropped._base}/${id}`],
            [input.optimizedTmp, `${paths.optimized._base}/${id}`],
        ];

        await Promise.all(ignoreErrorCodes(
            moves.map(move => fs.link(...move)),
            'EEXIST',
        ));
    }

    return id;
}
