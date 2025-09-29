import { exiftool, ExifDate, ExifTime, ExifDateTime } from 'exiftool-vendored';

import { hasOwn } from '../../utils/typeWorkarounds';
import { InvalidBufferError } from '.';
import { exifKeys, type Image } from '../../models/image';

const formatTimestamp = (input: string | number | ExifDate | ExifTime | ExifDateTime) =>
    input instanceof ExifDate ||
    input instanceof ExifTime ||
    input instanceof ExifDateTime
        ? input.toExifString()
        : typeof input === 'number'
            ? input.toString()
            : input;

const pickByKeys = <
    T extends object,
    K extends ReadonlyArray<PropertyKey>
>(object: T, keys: K) => {
    type KK = Extract<keyof T, K[number]>;

    const result: { [P in KK]?: T[P] } = {};
    for (const key of keys)
        if (hasOwn<T, K[number]>(object, key))
            result[key] = object[key];

    return result;
}

export const extractHashAndExif = (path: string): {
    hash: Promise<Image['hash']>;
    exif: Promise<Image['exif']>;
} => {
    const read = exiftool.read(path, { imageHashType: 'SHA256' });

    const hash = read.then(({ ImageDataHash }) => {
        if (ImageDataHash === undefined) throw new InvalidBufferError();
        return ImageDataHash;
    });

    const exif = read
        .then(({
            DateTimeOriginal,
            CreateDate,
            ModifyDate,

            GPSLatitude,
            GPSLongitude,
            GPSDateStamp,
            GPSTimeStamp,

            ...rest
        }) => {
            const exifRaw = {
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

                ...rest,
            };

            const filteredExif = pickByKeys(exifRaw, exifKeys);
            if (Object.keys(filteredExif).length === 0) throw Error();
            return filteredExif;
        })
        .catch(() => null);

    return { hash, exif };
};
