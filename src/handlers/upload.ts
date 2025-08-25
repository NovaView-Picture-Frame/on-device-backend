import { createHash, randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import type { Context } from 'koa';
import { getStreamAsBuffer, MaxBufferError } from 'get-stream';
import sharp from 'sharp';

import config from '../utils/config';
import { BadRequestError } from '../middleware/error';
import { getByHash, upsert } from '../services/imageRepository';
import ignoreErrorCode from '../utils/ignoreErrorCode';

export default async (ctx: Context) => {
    const buf = await getStreamAsBuffer(ctx.req, {
        maxBuffer: config.size_limit,
    }).catch(err => {
        if (err instanceof MaxBufferError)
            throw new BadRequestError(`Max ${config.size_limit} bytes`);
        
        throw err;
    });
    if (buf.length === 0) throw new BadRequestError("Invalid request body");

    const hash = createHash('sha256').update(buf).digest();
    const existing = getByHash(hash);
    if (existing) {
        ctx.body = {
            data: {
                id: existing.id,
                created: false,
                cover_left: existing.cover_left,
                cover_top: existing.cover_top,
            }
        };

        return;
    }

    const uuid = randomUUID();
    const originalTmp = `${config.paths.originals._tmp}/${uuid}`;
    const croppedTmp = `${config.paths.cropped._tmp}/${uuid}`;
    try {
        const [{ cropOffsetLeft, cropOffsetTop }] = await Promise.all([
            sharp(buf)
                .resize(config.screen_width, config.screen_height, {
                    position: 'entropy'
                })
                .toFile(croppedTmp)
                .catch(() => {
                    throw new BadRequestError("Invalid image buffer")
                }),
            fs.writeFile(originalTmp, buf),
        ]);

        const hashHex = hash.toString('hex');
        await ignoreErrorCode([
            fs.link(originalTmp, `${config.paths.originals._base}/${hashHex}`),
            fs.link(croppedTmp, `${config.paths.cropped._base}/${hashHex}`),
        ], 'EEXIST');
        
        const record = upsert(
            hash,
            Math.abs(cropOffsetLeft ?? 0),
            Math.abs(cropOffsetTop ?? 0)
        );

        ctx.body = {
            data: {
                id: record.id,
                created: record.created,
                cover_left: record.cover_left,
                cover_top: record.cover_top,
            }
        };
    } finally {
        await ignoreErrorCode([
            fs.unlink(originalTmp),
            fs.unlink(croppedTmp)
        ], 'ENOENT')
    }
}
