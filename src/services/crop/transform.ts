import fs from 'fs/promises';
import sharp from 'sharp';

import config from '../../config';
import { updateOffset } from '../../repositories/images';
import type { ImageRecord, ExtractOffsetUpdate } from '../../models/image';

export const resizeAndExtract = (
    offset: Pick<ImageRecord['extractRegion'], 'left' | 'top'>,
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
