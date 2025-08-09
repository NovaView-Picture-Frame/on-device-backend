import type { Context } from 'koa';
import { getStreamAsBuffer, MaxBufferError } from 'get-stream';
import { PayloadTooLargeError, BadRequestError } from 'http-errors-enhanced';
import sharp from 'sharp';

import type { Parameters } from '../schemas/parameters.js';

export default (parameters: Parameters) =>
    async (ctx: Context) => {
        let buf: Buffer;
        try {
            buf = await getStreamAsBuffer(ctx.req, { maxBuffer: parameters.size_limit });
        } catch (err) {
            if (err instanceof MaxBufferError)
                throw new PayloadTooLargeError(`Max ${parameters.size_limit} bytes`);
            throw err;
        }

        let meta: sharp.Metadata;
        try {
            meta = await sharp(buf).metadata();
        } catch {
            throw new BadRequestError("Invalid image data");
        }

        ctx.body = { data: meta };
    }
