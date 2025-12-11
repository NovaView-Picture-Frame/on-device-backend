import sharp from 'sharp';

import { appConfig } from '../../../config';
import type { ExtractOffsetUpdate } from '../../../models/images';

export const resizeAndExtract = (input: {
    record: ExtractOffsetUpdate,
    src: string,
    dest: string,
}) => sharp(input.src)
    .resize(appConfig.device.screen.width, appConfig.device.screen.height, {
        fit: 'outside',
    })
    .extract({
        left: input.record.extractRegion.left,
        top: input.record.extractRegion.top,
        width: appConfig.device.screen.width,
        height: appConfig.device.screen.height,
    })
    .keepIccProfile()
    .png()
    .toFile(input.dest);
