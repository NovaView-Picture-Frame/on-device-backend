import { z } from 'zod';
import type { RouterContext } from '@koa/router';

import { BadRequestError, NotFoundError } from '../middleware/error';
import { getByHash } from '../services/imageRepository';

const queryByHashSchema = z.object({
    sha256: z.string().nonempty().regex(/^[a-f0-9]{64}$/),
}).strict();

export default (ctx: RouterContext) => {
    const { data, error } = queryByHashSchema.safeParse(ctx.request.body);
    if (error) throw new BadRequestError("Invalid request body");

    const record = getByHash(Buffer.from(data.sha256, 'hex'));
    if (record === undefined) throw new NotFoundError("Image not found");

    ctx.body = {
        data: {
            id: record.id,
            cover_left: record.cover_left,
            cover_top: record.cover_top
        }
    };
}
