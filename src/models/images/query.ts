import { z } from 'zod';
import { asField } from '@gqloom/zod';
import { GraphQLID } from 'graphql';

import { imageRecordSchema, type ImageRecord } from '.';

export type FieldsSelection = {
    [K in keyof ImageRecord]?: NonNullable<ImageRecord[K]> extends object
        ? (keyof NonNullable<ImageRecord[K]>)[]
        : 'include';
};

type ZodPartial<T> = Partial<{
    [P in keyof T]: T[P] | undefined
}>;

interface ImageQueryRaw extends Omit<ImageRecord, 'extractRegion' | 'place'> {
    extractRegion: ZodPartial<ImageRecord['extractRegion']>;
    place: ZodPartial<ImageRecord['place']>;
}

export const imageQuerySchema = imageRecordSchema.extend({
    id: imageRecordSchema.shape.id.register(asField, { type: GraphQLID }),
    extractRegion: imageRecordSchema.shape.extractRegion.partial(),
    place: imageRecordSchema.shape.place.unwrap().partial().nullable(),
}).partial() satisfies z.ZodType<ZodPartial<ImageQueryRaw>>;

export type ImageQuery = z.infer<typeof imageQuerySchema>;
