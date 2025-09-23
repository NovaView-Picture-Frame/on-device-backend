import exif from 'exif-reader';
import type { Sharp, Metadata, OutputInfo } from 'sharp';

import { InvalidBufferError } from '.';
import config from '../../utils/config';
import type { Exif } from '../../models/image';

class StreamAbortedError extends Error {}

const gpsToDecimal = (gps: number[], ref: string) => {
    const [degrees, minutes, seconds] = gps;
    if (
        degrees === undefined ||
        minutes === undefined ||
        seconds === undefined
    ) return null;

    const decimal = degrees + minutes / 60 + seconds / 3600;
    return ref === 'S' || ref === 'W' ? -decimal : decimal;
};

export const parseExifBuffer = (buffer: Exclude<Metadata['exif'], undefined>): Exif => {
    const { Image, Photo, GPSInfo } = exif(buffer);

    const gpsLatitude = GPSInfo?.GPSLatitude && GPSInfo.GPSLatitudeRef
        ? gpsToDecimal(GPSInfo.GPSLatitude, GPSInfo.GPSLatitudeRef)
        : null;

    const gpsLongitude = GPSInfo?.GPSLongitude && GPSInfo.GPSLongitudeRef
        ? gpsToDecimal(GPSInfo.GPSLongitude, GPSInfo.GPSLongitudeRef)
        : null;

    return {
        make: Image?.Make || null,
        model: Image?.Model || null,
        lensMake: Photo?.LensMake || null,
        lensModel: Photo?.LensModel || null,
        software: Image?.Software || null,

        dateTimeOriginal: Photo?.DateTimeOriginal?.toISOString() || null,
        offsetTimeOriginal: Photo?.OffsetTimeOriginal || null,

        exposureTime: Photo?.ExposureTime || null,
        exposureProgram: Photo?.ExposureProgram || null,
        isoSpeedRatings: Photo?.ISOSpeedRatings || null,
        fNumber: Photo?.FNumber || null, 
        apertureValue: Photo?.ApertureValue || null,
        shutterSpeedValue: Photo?.ShutterSpeedValue || null,
        focalLength: Photo?.FocalLength || null,
        focalLengthIn35mmFilm: Photo?.FocalLengthIn35mmFilm || null,
        flash: Photo?.Flash || null,

        pixelXDimension: Photo?.PixelXDimension || null,
        pixelYDimension: Photo?.PixelYDimension || null,
        orientation: Image?.Orientation || null,
        colorSpace: Photo?.ColorSpace || null,

        gpsLatitude,
        gpsLongitude,
        gpsAltitude: GPSInfo?.GPSAltitude || null,
        gpsImgDirection: GPSInfo?.GPSImgDirection || null,
    };
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
