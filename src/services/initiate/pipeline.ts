import { Writable } from 'node:stream';
import { createWriteStream } from 'node:fs';
import type { ReadableStream } from 'node:stream/web';
import type { Sharp } from 'sharp';

import config from '../../utils/config';

const resizeToCover = (sharpInstance: Sharp, path: string) => sharpInstance
    .resize(config.screenWidth, config.screenHeight, {
        fit: 'cover',
        position: 'entropy',
    })
    .png()
    .toFile(path);

export const getMetadataAndResizeToCover = (sharpInstance: Sharp, path: string) => {
    const metadata = sharpInstance.metadata();
    const resizeResult = metadata.then(async ({ width, height }) => {
        const { cropOffsetLeft, cropOffsetTop } = await resizeToCover(sharpInstance, path);

        const scale = Math.max(
            config.screenWidth / width,
            config.screenHeight / height
        );

        return {
            extract_left: Math.abs(cropOffsetLeft ?? 0),
            extract_top: Math.abs(cropOffsetTop ?? 0),
            extract_width: Math.round(width * scale),
            extract_height: Math.round(height * scale),
        };
    });

    return { metadata, resizeResult };
}

export const saveStream = (
    stream: ReadableStream<Uint8Array>,
    path: string,
    signal: AbortSignal
) => stream.pipeTo(
    Writable.toWeb(createWriteStream(path)),
    { signal }
);

export const resizeToInside = (sharpInstance: Sharp, path: string) => sharpInstance
    .resize(config.previewMaxWidth, config.previewMaxHeight, {
        fit: 'inside',
        withoutEnlargement: true
    })
    .avif()
    .toFile(path);
