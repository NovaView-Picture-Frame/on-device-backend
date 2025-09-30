import { z } from 'zod';

import { exifSchema, placeSchema, toTSPartial, type ImageRecord } from '.';

export type FieldsSelection<T = ImageRecord> = {
    [K in keyof T]?: NonNullable<T[K]> extends object
        ? (keyof NonNullable<T[K]>)[]
        : 'include';
};

const extractRegionSchema = z.object({
    left: z.number(),
    top: z.number(),
    width: z.number(),
    height: z.number(),
}) satisfies z.ZodType<ImageRecord['extractRegion']>;

export const extractRegionKeys = extractRegionSchema.keyof().options;

const imageSchema = z.object({
    id: z.int(),
    hash: z.string(),
    extractRegion: extractRegionSchema,
    exif: exifSchema,
    place: placeSchema,
}) satisfies z.ZodType<ImageRecord>;

interface ImageQueryRaw extends Omit<ImageRecord, 'extractRegion' | 'place'> {
    extractRegion: Partial<ImageRecord['extractRegion']>;
    place: Partial<ImageRecord['place']>;
}

const imageQuerySchemaRaw = imageSchema.extend({
    extractRegion: toTSPartial(imageSchema.shape.extractRegion),
    place: toTSPartial(imageSchema.shape.place),
}) satisfies z.ZodType<ImageQueryRaw>;

export const imageQuerySchema: z.ZodType<Partial<ImageQueryRaw>> = toTSPartial(imageQuerySchemaRaw);

export type ImageQuery = z.infer<typeof imageQuerySchema>;
