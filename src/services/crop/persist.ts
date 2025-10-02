import fs from 'fs/promises';

import { updateOffset } from '../../repositories/images';
import type { ExtractOffsetUpdate } from '../../models/images';

export const updateAndMove = (
    record: ExtractOffsetUpdate,
    croppedTmp: string,
    cropped: string
) => updateOffset(record)
    ? fs.rename(croppedTmp, cropped)
    : Promise.resolve();
