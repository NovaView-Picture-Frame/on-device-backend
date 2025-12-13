import { z } from 'zod';
import type { FastifyRequest } from 'fastify';

import { HttpBadRequestError } from '../../middleware/errorHandler';
import { deleteProcessor } from '../../services/images';

const paramsSchema = z.object({
    id: z.coerce.number().int().positive(),
});

export const deleteHandler = async (req: FastifyRequest) => {
    const paramsResult = paramsSchema.safeParse(req.params);
    if (!paramsResult.success) throw new HttpBadRequestError("Invalid URL parameters");

    await deleteProcessor(paramsResult.data.id);
    return { success: true }
}
