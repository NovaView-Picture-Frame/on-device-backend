import { load } from 'exifreader'
import type { Sharp, Metadata, OutputInfo } from 'sharp';

import { InvalidBufferError } from '.';
import { exifSchema } from '../../models/image';
import config from '../../utils/config';
import type { Exif } from '../../models/image';

class StreamAbortedError extends Error {}

export function convertDMSToDecimal(
    dms: NonNullable<Exif['GPSLatitude']>,
    ref: NonNullable<Exif['GPSLatitudeRef']>,
): number;
export function convertDMSToDecimal(
    dms: NonNullable<Exif['GPSLongitude']>,
    ref: NonNullable<Exif['GPSLongitudeRef']>,
): number;
export function convertDMSToDecimal(
    dms: NonNullable<Exif['GPSLatitude' | 'GPSLongitude']>,
    ref: NonNullable<Exif['GPSLatitudeRef' | 'GPSLongitudeRef']>,
) {
    const degrees = dms[0][0] / dms[0][1];
    const minutes = dms[1][0] / dms[1][1];
    const seconds = dms[2][0] / dms[2][1];
    const decimal = degrees + minutes / 60 + seconds / 3600;

    return ref === 'N' || ref === 'E' ? decimal : -decimal;
}

export const parseExifBuffer = (
    buffer: NonNullable<Metadata['exif']>,
    format: Metadata['format']
) => {
    const raw = (() => {
        try {
            return load(buffer.subarray(6));
        } catch {
            throw new InvalidBufferError();
        }
    })();

    const exif = Object.fromEntries(
        Object.entries(raw).map(([k, { value }]) => {
            const key = k.startsWith('GPS')
                ? k
                : k.charAt(0).toLowerCase() + k.slice(1);
            const val = Array.isArray(value) && value.length === 1 ? value[0] : value;

            return [
                key.replaceAll(' ', ''),
                k === 'FileType' ? format : val,
            ];
        })
    );

    const exifResult = exifSchema.safeParse(exif);
    return exifResult.success ? exifResult.data : null;
};

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
