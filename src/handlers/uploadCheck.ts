import type { RouterContext } from '@koa/router';
import { BadRequestError, NotFoundError } from 'http-errors-enhanced';
import { getId } from '../services/imageRepository.js';

export default (ctx: RouterContext) => {
    const { hash } = ctx.params;
    if (typeof hash !== 'string' || !/^[0-9a-fA-F]{64}$/.test(hash))
        throw new BadRequestError("Invalid hash");

    const id = getId(Buffer.from(hash, 'hex'));
    if (id === undefined) throw new NotFoundError("Image not found");

    ctx.body = {
        data: { id }
    };
}
