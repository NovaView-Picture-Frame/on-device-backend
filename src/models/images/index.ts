import { z } from 'zod';

const extractRegionSchema = z.object({
    left: z.int(),
    top: z.int(),
    width: z.int(),
    height: z.int(),
});

const metadataRequiredSchema = z.object({
    FileSize: z.int(),
    FileFormat: z.string(),
    ImageWidth: z.int(),
    ImageHeight: z.int(),
});

const metadataOptionalSchema = z.object({
    FileName: z.string(),
    MIMEType: z.string(),
    DateTimeOriginal: z.string(),
    CreateDate: z.string(),
    ModifyDate: z.string(),

    Orientation: z.int(),
    Megapixels: z.number(),

    Make: z.string(),
    Model: z.string(),
    Software: z.string(),
    LensMake: z.string(),
    LensModel: z.string(),
    FocalLength: z.string(),
    FocalLengthIn35mmFormat: z.string(),
    LensID: z.string(),

    ExposureTime: z.string(),
    ShutterSpeed: z.string(),
    FNumber: z.number(),
    Aperture: z.number(),
    ISO: z.int(),
    ExposureCompensation: z.int(),
    ExposureMode: z.string(),
    MeteringMode: z.string(),
    Flash: z.string(),
    WhiteBalance: z.string(),
    ColorTemperature: z.int(),

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
    AFConfidence: z.int(),
    AFMeasuredDepth: z.int(),

    ProfileDescription: z.string(),
    ColorPrimaries: z.string(),
    TransferCharacteristics: z.string(),
}).partial();

export const metadataSchema = metadataRequiredSchema.extend(metadataOptionalSchema.shape);

export const placeSchema = z.object({
    name: z.string(),
    type: z.string(),
    fullName: z.string(),
});

export const imageRecordSchema = z.object({
    id: z.int(),
    hash: z.string(),
    extractRegion: extractRegionSchema,
    metadata: metadataSchema,
    place: placeSchema.nullable(),
});

export type ImageRecord = z.infer<typeof imageRecordSchema>;
export type Image = Omit<ImageRecord, 'id'>;

export type ExtractRegionRecord = Pick<ImageRecord, 'id' | 'extractRegion'>;
export interface ExtractOffsetUpdate extends Pick<ImageRecord, 'id'> {
    extractRegion: Pick<ImageRecord['extractRegion'], 'left' | 'top'>;
}
