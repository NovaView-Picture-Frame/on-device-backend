import { z } from "zod";
import type { FastifyRequest } from "fastify";

import { HttpBadRequestError } from "../../middleware/errorHandler";
import { deleteImage } from "../../services/images";

const paramsSchema = z.strictObject({
    id: z.coerce.number().int().positive(),
});

export const deleteHandler = async (req: FastifyRequest) => {
    const paramsResult = paramsSchema.safeParse(req.params);
    if (!paramsResult.success) throw new HttpBadRequestError("Invalid URL parameters");

    await deleteImage(paramsResult.data.id);
    return { success: true };
};
