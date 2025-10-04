import { z } from 'zod';
import { asField } from '@gqloom/zod';
import { GraphQLNonNull, GraphQLID } from 'graphql';

import { imageRecordSchema, type ImageRecord } from '.';

type ZodPartial<T> = Partial<{
    [P in keyof T]: T[P] | undefined
}>;

type Field<T> = T extends object ? (keyof T)[] : 'include';

type ImageRecordFieldMap = {
    [K in keyof ImageRecord]: Field<NonNullable<ImageRecord[K]>>;
};

export type Selection = ZodPartial<ImageRecordFieldMap>;

export const selectionSchema: z.ZodType<Selection> = z.object({
    id: z.literal('include'),
    hash: z.literal('include'),
    extractRegion: z.array(imageRecordSchema.shape.extractRegion.keyof()).nonempty(),
    metadata: z.array(imageRecordSchema.shape.metadata.keyof()).nonempty(),
    place: z.array(imageRecordSchema.shape.place.unwrap().keyof()).nonempty(),
}).partial();

interface ImageQueryRaw extends Omit<ImageRecord, 'extractRegion' | 'place'> {
    extractRegion: ZodPartial<ImageRecord['extractRegion']>;
    place: ZodPartial<ImageRecord['place']>;
}

export type ImageQuery = ZodPartial<ImageQueryRaw>;

export const imageQuerySchema: z.ZodType<ImageQuery> = imageRecordSchema.extend({
    id: imageRecordSchema.shape.id.register(asField, {
        type: new GraphQLNonNull(GraphQLID)
    }),
    extractRegion: imageRecordSchema.shape.extractRegion.partial(),
    place: imageRecordSchema.shape.place.unwrap().partial().nullable(),
}).partial();
