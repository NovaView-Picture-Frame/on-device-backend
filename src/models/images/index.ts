import { z } from 'zod';

import { toTSPartial } from '../../utils/zodWorkAround';
export { toTSPartial };

interface ExtractOffset {
    left: number;
    top: number;
}

interface ExtractRegion extends ExtractOffset {
    width: number;
    height: number;
}

const exifSchemaRaw = z.object({
    FileName: z.string(),
    FileSize: z.string(),
    FileType: z.string(),
    FileExtension: z.string(),
    MIMEType: z.string(),
    DateTimeOriginal: z.string(),
    CreateDate: z.string(),
    ModifyDate: z.string(),

    ImageWidth: z.number(),
    ImageHeight: z.number(),
    Orientation: z.number(),
    Megapixels: z.number(),

    Make: z.string(),
    Model: z.string(),
    LensMake: z.string(),
    LensModel: z.string(),
    FocalLength: z.string(),
    FocalLengthIn35mmFormat: z.string(),
    LensID: z.string(),

    ExposureTime: z.string(),
    ShutterSpeed: z.string(),
    FNumber: z.number(),
    Aperture: z.number(),
    ISO: z.number(),
    ExposureCompensation: z.number(),
    ExposureMode: z.string(),
    MeteringMode: z.string(),
    Flash: z.string(),
    WhiteBalance: z.string(),
    ColorTemperature: z.number(),

    GPSLatitude: z.number(),
    GPSLongitude: z.number(),
    GPSAltitude: z.number(),
    GPSPosition: z.string(),
    GPSDateStamp: z.string(),
    GPSTimeStamp: z.string(),
    GPSImgDirection: z.number(),
    GPSHPositioningError: z.string(),

    SceneType: z.string(),
    SubjectArea: z.string(),
    BrightnessValue: z.number(),
    LightValue: z.number(),
    FocusDistanceRange: z.string(),
    ColorSpace: z.string(),
    HDRGain: z.number(),
    AFConfidence: z.number(),
    AFMeasuredDepth: z.number(),

    ProfileDescription: z.string(),
    ColorPrimaries: z.string(),
    TransferCharacteristics: z.string(),
});

export const exifSchema = toTSPartial(exifSchemaRaw);
export const exifKeys = exifSchemaRaw.keyof().options;

export const placeSchema = z.object({
    name: z.string(),
    type: z.string(),
    fullName: z.string(),
});

export const placeKeys = placeSchema.keyof().options;

export interface Image {
    hash: string;
    extractRegion: ExtractRegion;
    exif: z.infer<typeof exifSchema> | null;
    place: z.infer<typeof placeSchema> | null;
}

export interface ImageRecord extends Image {
    id: number;
}

export type ExtractRegionRecord = Pick<ImageRecord, 'id' | 'extractRegion'>;
export type ExtractOffsetUpdate = Pick<ImageRecord, 'id'> & Pick<ImageRecord['extractRegion'], 'left' | 'top'>;
