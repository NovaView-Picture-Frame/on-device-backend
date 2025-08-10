import { createHash, randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import type { Context } from 'koa';
import { getStreamAsBuffer, MaxBufferError } from 'get-stream';
import { PayloadTooLargeError, BadRequestError } from 'http-errors-enhanced';
import sharp from 'sharp';

import config from '../utils/config.js';
import { insert } from '../services/imageRepository.js';

export default async (ctx: Context) => {
    let buf: Buffer;
    try {
        buf = await getStreamAsBuffer(ctx.req, { maxBuffer: config.size_limit });
    } catch (err) {
        if (err instanceof MaxBufferError)
            throw new PayloadTooLargeError(`Max ${config.size_limit} bytes`);
        throw err;
    }

    let meta: sharp.Metadata;
    try {
        meta = await sharp(buf).metadata();
        console.log(meta);
    } catch {
        throw new BadRequestError("Invalid image data");
    }

    const path = `${config.work_directory}/tmp/${randomUUID()}`;
    await fs.writeFile(path, buf);
    
    try {
        const sha256 = createHash('sha256').update(buf).digest();
        try {
            await fs.link(
                path,
                `${config.work_directory}/originals/${sha256.toString('hex')}`
            );
        } catch (err) {
            const { code } = err as NodeJS.ErrnoException;
            if (code !== 'EEXIST') throw err;
        }

        const { id, inserted } = insert(sha256);
        ctx.body = {
            data: { id, inserted }
        };
    } finally {
        await fs.unlink(path).catch(() => {});
    }
}
