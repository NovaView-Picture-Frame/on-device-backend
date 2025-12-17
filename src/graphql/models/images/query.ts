import { z } from "zod";
import { asField } from "@gqloom/zod";
import { GraphQLNonNull, GraphQLID } from "graphql";

import { imageRecordSchema, type ImageRecord } from "../../../models/images";

type ZodPartial<T> = Partial<{
    [P in keyof T]: T[P] | undefined;
}>;

type Field<T> = T extends object ? (keyof T)[] : "include";

type ImageRecordFieldMap = {
    [K in keyof ImageRecord]: Field<NonNullable<ImageRecord[K]>>;
};

export type Selection = ZodPartial<ImageRecordFieldMap>;

interface ImageQueryRaw extends Omit<ImageRecord, "extractRegion" | "place"> {
    extractRegion: ZodPartial<ImageRecord["extractRegion"]>;
    place: ZodPartial<ImageRecord["place"]>;
}

type ImageQuery = ZodPartial<ImageQueryRaw>;

export const imageQuerySchema: z.ZodType<ImageQuery> = imageRecordSchema.extend({
    id: imageRecordSchema.shape.id.register(asField, { type: new GraphQLNonNull(GraphQLID) }),
});
