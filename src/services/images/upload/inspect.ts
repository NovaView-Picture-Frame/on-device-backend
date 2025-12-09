import {
    exiftool,
    ExifDate,
    ExifTime,
    ExifDateTime,
} from 'exiftool-vendored';
import type { Metadata } from 'sharp';

import { InvalidBufferError } from './errors';
import { imageRecordSchema, type Image } from '../../../models/images';

const formatTimestamp = (input: string | number | ExifDate | ExifTime | ExifDateTime) =>
    input instanceof ExifDate ||
    input instanceof ExifTime ||
    input instanceof ExifDateTime
        ? input.toExifString()
        : typeof input === 'number'
            ? input.toString()
            : input;

const hasOwn = <
    T extends object,
    K extends PropertyKey,
>(object: T, key: K): key is Extract<keyof T, K> =>
    Object.hasOwn(object, key);

const pickByKeys = <
    T extends object,
    K extends ReadonlyArray<PropertyKey>,
>(object: T, keys: K) => {
    type KK = Extract<keyof T, K[number]>;

    const result: { [P in KK]?: T[P] } = {};
    for (const key of keys)
        if (hasOwn<T, K[number]>(object, key))
            result[key] = object[key];

    return result;
}

export const extractHashAndMetadata = async (
    path: string,
    size: number,
    meta: Metadata,
): Promise<{
    hash: Image['hash'];
    metadata: Image['metadata'];
}> => {
    const {
        ImageDataHash,

        DateTimeOriginal,
        CreateDate,
        ModifyDate,

        GPSLatitude,
        GPSLongitude,
        GPSDateStamp,
        GPSTimeStamp,

        ...rest
    } = await exiftool.read(path, { imageHashType: 'SHA256' });
    if (ImageDataHash === undefined) throw new InvalidBufferError();

    const exifToolMetadata = {
        ...rest,

        ...(DateTimeOriginal !== undefined && {
            DateTimeOriginal: formatTimestamp(DateTimeOriginal)
        }),
        ...(CreateDate !== undefined && {
            CreateDate: formatTimestamp(CreateDate)
        }),
        ...(ModifyDate !== undefined && {
            ModifyDate: formatTimestamp(ModifyDate)
        }),

        ...(GPSLatitude !== undefined && Number.isFinite(+GPSLatitude) && {
            GPSLatitude: +GPSLatitude
        }),
        ...(GPSLongitude !== undefined && Number.isFinite(+GPSLongitude) && {
            GPSLongitude: +GPSLongitude
        }),
        ...(GPSDateStamp !== undefined && {
            GPSDateStamp: formatTimestamp(GPSDateStamp)
        }),
        ...(GPSTimeStamp !== undefined && {
            GPSTimeStamp: formatTimestamp(GPSTimeStamp)
        }),
    };

    const metadata = {
        ...pickByKeys(
            exifToolMetadata,
            imageRecordSchema.shape.metadata.keyof().options
        ),

        FileSize: size,
        FileFormat: meta.format,
        ImageWidth: meta.width,
        ImageHeight: meta.height,
    };

    return {
        hash: ImageDataHash,
        metadata,
    }
}
