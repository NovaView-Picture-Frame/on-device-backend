import fs from 'fs/promises';
import sharp from 'sharp';

import config from '../../utils/config';
import { updateOffset } from '../../repositories/images';
import type { ExtractOffset, ExtractOffsetUpdate } from '../../models/image';

export const resizeAndExtract = (
    offset: ExtractOffset,
    src: string,
    dest: string
) => sharp(src)
    .resize(config.screenWidth, config.screenHeight, {
        fit: 'outside',
    })
    .extract({
        left: offset.left,
        top: offset.top,
        width: config.screenWidth,
        height: config.screenHeight,
    })
    .png()
    .toFile(dest);

export const updateAndMove = (
    extractOffsetUpdate: ExtractOffsetUpdate,
    croppedTmp: string,
    cropped: string
) => updateOffset(extractOffsetUpdate)
    ? fs.rename(croppedTmp, cropped)
    : Promise.resolve();
