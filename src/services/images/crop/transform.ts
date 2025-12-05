import sharp from 'sharp';

import config from '../../../config';
import type { ExtractOffsetUpdate } from '../../../models/images';

export const resizeAndExtract = (
    record: ExtractOffsetUpdate,
    src: string,
    dest: string,
) => sharp(src)
    .resize(config.screenWidth, config.screenHeight, {
        fit: 'outside',
    })
    .extract({
        left: record.extractRegion.left,
        top: record.extractRegion.top,
        width: config.screenWidth,
        height: config.screenHeight,
    })
    .keepIccProfile()
    .png()
    .toFile(dest);
