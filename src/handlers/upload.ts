import { createHash, randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import type { Context } from 'koa';
import { getStreamAsBuffer, MaxBufferError } from 'get-stream';
import sharp from 'sharp';

import type { ExtractRegionWithID } from '../services/imageRepository';
import config from '../utils/config';
import { BadRequestError } from '../middleware/error';
import { getByHash, upsert } from '../services/imageRepository';
import ignoreErrorCode from '../utils/ignoreErrorCode';

const buildResponse = (created: boolean, region: ExtractRegionWithID) => ({
    data: {
        id: region.id,
        created,
        extract_left_ratio: region.extract_left / region.extract_width,
        extract_top_ratio: region.extract_top / region.extract_height,
    }
});

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
        ctx.body = buildResponse(false, existing);
        return;
    }

    const meta = await sharp(buf)
        .metadata()
        .catch(() => {
            throw new BadRequestError("Invalid image buffer")
        });

    const uuid = randomUUID();
    const originalTmp = `${config.paths.originals._tmp}/${uuid}`;
    const croppedTmp = `${config.paths.cropped._tmp}/${uuid}`;

    try {
        const [{ cropOffsetLeft, cropOffsetTop }] = await Promise.all([
            sharp(buf)
                .resize(config.screen_width, config.screen_height, {
                    fit: 'cover',
                    position: 'entropy',
                })
                .toFile(croppedTmp),
            fs.writeFile(originalTmp, buf),
        ]);

        const hashHex = hash.toString('hex');
        await ignoreErrorCode([
            fs.link(originalTmp, `${config.paths.originals._base}/${hashHex}`),
            fs.link(croppedTmp, `${config.paths.cropped._base}/${hashHex}`),
        ], 'EEXIST');

        const scale = Math.max(
            config.screen_width / meta.width,
            config.screen_height / meta.height
        );
        const record = upsert({
            hash,
            extract_left: Math.abs(cropOffsetLeft ?? 0),
            extract_top: Math.abs(cropOffsetTop ?? 0),
            extract_width: Math.round(meta.width * scale),
            extract_height: Math.round(meta.height * scale),
        });

        ctx.body = buildResponse(record.created, record);
    } finally {
        await ignoreErrorCode([
            fs.unlink(originalTmp),
            fs.unlink(croppedTmp)
        ], 'ENOENT')
    }
}
