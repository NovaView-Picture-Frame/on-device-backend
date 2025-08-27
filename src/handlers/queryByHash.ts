import { z } from 'zod';
import type { RouterContext } from '@koa/router';
import { BadRequestError, NotFoundError } from '../middleware/error';
import { getByHash } from '../services/imageRepository';

const bodySchema = z.object({
    hash: z.string().nonempty().regex(/^[a-f0-9]{64}$/),
}).strict();

export default (ctx: RouterContext) => {
    const bodyResult = bodySchema.safeParse(ctx.request.body);
    if (!bodyResult.success) throw new BadRequestError("Invalid request body");

    const record = getByHash(Buffer.from(bodyResult.data.hash, 'hex'));
    if (record === undefined) throw new NotFoundError("Image not found");

    ctx.body = {
        data: {
            id: record.id,
        }
    };
}
