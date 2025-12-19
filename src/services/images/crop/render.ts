import sharp from "sharp";

import { config } from "../../../config";
import type { ExtractOffsetUpdate } from "../../../models/images";

export const resizeAndExtract = (input: {
    record: ExtractOffsetUpdate;
    src: string;
    dest: string;
}) => sharp(input.src)
    .resize(config.device.screen.width, config.device.screen.height, { fit: "outside" })
    .extract({
        left: input.record.extractRegion.left,
        top: input.record.extractRegion.top,
        width: config.device.screen.width,
        height: config.device.screen.height,
    })
    .keepIccProfile()
    .png()
    .toFile(input.dest);
