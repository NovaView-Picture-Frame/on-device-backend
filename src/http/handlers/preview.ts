import { z } from "zod";
import type { FastifyRequest, FastifyReply } from "fastify";

import { HttpBadRequestError, HttpNotFoundError } from "../../middleware/errorHandler";
import { getOptimizedImage } from "../../services/images";

const paramsSchema = z.object({
    id: z.coerce.number().int().positive(),
});

export const previewHandler = async (req: FastifyRequest, reply: FastifyReply) => {
    const paramsResult = paramsSchema.safeParse(req.params);
    if (!paramsResult.success) throw new HttpBadRequestError("Invalid URL parameters");

    const image = await getOptimizedImage(paramsResult.data.id);
    if (!image) throw new HttpNotFoundError("Image not found");

    reply.header("Content-Length", image.size.toString());
    reply.type(image.mime);
    return image.stream;
};
