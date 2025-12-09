import sharp from 'sharp';

import { config } from '../../../config';
import type { ExtractOffsetUpdate } from '../../../models/images';

export const resizeAndExtract = (input: {
    record: ExtractOffsetUpdate,
    src: string,
    dest: string,
}) => sharp(input.src)
    .resize(config.screenWidth, config.screenHeight, {
        fit: 'outside',
    })
    .extract({
        left: input.record.extractRegion.left,
        top: input.record.extractRegion.top,
        width: config.screenWidth,
        height: config.screenHeight,
    })
    .keepIccProfile()
    .png()
    .toFile(input.dest);
