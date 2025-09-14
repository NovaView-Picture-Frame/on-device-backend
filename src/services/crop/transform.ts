import fs from 'fs/promises';
import sharp from 'sharp';

import config from '../../utils/config';
import { updateOffset } from '../../repositories/images';
import type { ExtractOffset, ExtractOffsetWithID } from '../../repositories/images';

export const resizeAndExtract = (
    offset: ExtractOffset,
    src: string,
    dest: string
) => sharp(src)
    .resize(config.screenWidth, config.screenHeight, {
        fit: 'outside',
    })
    .extract({
        left: offset.extract_left,
        top: offset.extract_top,
        width: config.screenWidth,
        height: config.screenHeight,
    })
    .png()
    .toFile(dest);

export const updateAndMove = (
    extractOffsetWithID: ExtractOffsetWithID,
    croppedTmp: string,
    cropped: string
) => updateOffset(extractOffsetWithID)
    ? fs.rename(croppedTmp, cropped)
    : Promise.resolve();
