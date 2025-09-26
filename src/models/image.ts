import { z } from 'zod';

export interface ExtractOffset {
    left: number;
    top: number;
}

interface ExtractRegion extends ExtractOffset {
    width: number;
    height: number;
}

export const exifSchema = z.object({
    make: z.string(),
    model: z.string(),
    orientation: z.number(),
    xResolution: z.tuple([z.number(), z.number()]),
    yResolution: z.tuple([z.number(), z.number()]),
    resolutionUnit: z.number(),
    software: z.string(),
    dateTime: z.string(),
    hostComputer: z.string(),
    exposureTime: z.tuple([z.number(), z.number()]),
    fNumber: z.tuple([z.number(), z.number()]),
    exposureProgram: z.number(),
    iSOSpeedRatings: z.number(),
    exifVersion: z.tuple([z.number(), z.number(), z.number(), z.number()]),
    dateTimeOriginal: z.string(),
    dateTimeDigitized: z.string(),
    offsetTime: z.string(),
    offsetTimeOriginal: z.string(),
    offsetTimeDigitized: z.string(),
    shutterSpeedValue: z.tuple([z.number(), z.number()]),
    apertureValue: z.tuple([z.number(), z.number()]),
    brightnessValue: z.tuple([z.number(), z.number()]),
    exposureBiasValue: z.tuple([z.number(), z.number()]),
    meteringMode: z.number(),
    flash: z.number(),
    focalLength: z.tuple([z.number(), z.number()]),
    subjectArea: z.tuple([z.number(), z.number(), z.number(), z.number()]),
    subSecTimeOriginal: z.string(),
    subSecTimeDigitized: z.string(),
    colorSpace: z.number(),
    pixelXDimension: z.number(),
    pixelYDimension: z.number(),
    sensingMethod: z.number(),
    sceneType: z.number(),
    exposureMode: z.number(),
    whiteBalance: z.number(),
    focalLengthIn35mmFilm: z.number(),
    lensSpecification: z.tuple([
        z.tuple([z.number(), z.number()]),
        z.tuple([z.number(), z.number()]),
        z.tuple([z.number(), z.number()]),
        z.tuple([z.number(), z.number()])
    ]),
    lensMake: z.string(),
    lensModel: z.string(),
    compositeImage: z.number(),
    GPSLatitudeRef: z.string(),
    GPSLatitude: z.tuple([
        z.tuple([z.number(), z.number()]),
        z.tuple([z.number(), z.number()]),
        z.tuple([z.number(), z.number()])
    ]),
    GPSLongitudeRef: z.string(),
    GPSLongitude: z.tuple([
        z.tuple([z.number(), z.number()]),
        z.tuple([z.number(), z.number()]),
        z.tuple([z.number(), z.number()])
    ]),
    GPSAltitudeRef: z.number(),
    GPSAltitude: z.tuple([z.number(), z.number()]),
    GPSTimeStamp: z.tuple([
        z.tuple([z.number(), z.number()]),
        z.tuple([z.number(), z.number()]),
        z.tuple([z.number(), z.number()])
    ]),
    GPSSpeedRef: z.string(),
    GPSSpeed: z.tuple([z.number(), z.number()]),
    GPSImgDirectionRef: z.string(),
    GPSImgDirection: z.tuple([z.number(), z.number()]),
    GPSDestBearingRef: z.string(),
    GPSDestBearing: z.tuple([z.number(), z.number()]),
    GPSDateStamp: z.string(),
    GPSHPositioningError: z.tuple([z.number(), z.number()]),
    focalLength35efl: z.number(),
    scaleFactorTo35mmEquivalent: z.number(),
    fieldOfView: z.number(),
    fileType: z.string(),
}).partial();

export type Exif = z.infer<typeof exifSchema>;

export const placeSchema = z.object({
    name: z.string(),
    addresstype: z.string(),
    display_name: z.string(),
}).transform(data => ({
    name: data.name,
    type: data.addresstype,
    fullName: data.display_name,
}));

export interface Image {
    hash: Buffer;
    extractRegion: ExtractRegion;
    exif: Exif | null;
    place: z.infer<typeof placeSchema> | null;
}

export interface ImageRecord extends Image {
    id: number;
}

export type ExtractRegionRecord = Pick<ImageRecord, 'id' | 'extractRegion'>;
export type ExtractOffsetUpdate = Pick<ImageRecord, 'id'> & Pick<ImageRecord['extractRegion'], 'left' | 'top'>;
