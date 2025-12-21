import type { z } from "zod";
import { asField } from "@gqloom/zod";
import { GraphQLNonNull, GraphQLID } from "graphql";

import type { ZodPartial } from "../../utils/zod";
import { imageRecordSchema, type ImageRecord } from "../../models/images";

interface ImageQueryRaw extends Omit<ImageRecord, "extractRegion" | "place"> {
    extractRegion: ZodPartial<ImageRecord["extractRegion"]>;
    place: ZodPartial<ImageRecord["place"]>;
}

type ImageQuery = ZodPartial<ImageQueryRaw>;

export const imageQuerySchema: z.ZodType<ImageQuery> = imageRecordSchema.extend({
    id: imageRecordSchema.shape.id.register(asField, { type: new GraphQLNonNull(GraphQLID) }),
});
