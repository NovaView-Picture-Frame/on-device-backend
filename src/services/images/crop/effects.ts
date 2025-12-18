import fs from "node:fs/promises";

import { updateOffset } from "../../../repositories/images";
import type { ExtractOffsetUpdate } from "../../../models/images";

export const updateAndMove = (input: {
    record: ExtractOffsetUpdate,
    croppedTmp: string,
    cropped: string
}) => updateOffset(input.record)
    ? fs.rename(input.croppedTmp, input.cropped)
    : Promise.resolve();
