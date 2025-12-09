import fs from 'node:fs/promises';

import { deleteByID } from '../../repositories/images';
import { onImagesChanged } from './carousel';
import { ignoreErrorCodes } from '../../utils/ignoreErrorCodes';
import { config } from '../../config';

export const deleteProcessor = async (id: Parameters<typeof deleteByID>[0]) => {
    if (!deleteByID(id)) return;

    onImagesChanged();
    await Promise.all(ignoreErrorCodes(
        [
            `${config.paths.originals._base}/${id}`,
            `${config.paths.cropped._base}/${id}`,
            `${config.paths.optimized._base}/${id}`,
        ].map(fs.unlink),
        'ENOENT',
    ))
}
