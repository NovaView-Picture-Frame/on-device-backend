import { createReadStream } from 'node:fs';
import fs from 'node:fs/promises';
import { z } from 'zod';
import type { FastifyRequest, FastifyReply } from 'fastify';

import { HttpBadRequestError, HttpNotFoundError } from '../../middleware/errorHandler';
import { getExtractRegionRecordById } from '../../repositories/images';
import { paths } from '../../config';

const paramsSchema = z.object({
    id: z.coerce.number().int().positive(),
});

export const previewHandler = async (req: FastifyRequest, reply: FastifyReply) => {
    const paramsResult = paramsSchema.safeParse(req.params);
    if (!paramsResult.success) throw new HttpBadRequestError("Invalid URL parameters");

    const extractRegionRecord = getExtractRegionRecordById(paramsResult.data.id);
    if (!extractRegionRecord) throw new HttpNotFoundError("Image not found");

    const path = `${paths.optimized._base}/${extractRegionRecord.id}`;
    const stats = await fs.stat(path);

    reply.header('Content-Length', stats.size.toString());
    reply.type('image/avif');
    return createReadStream(path);
}
