import fs from 'node:fs/promises';

import { deleteById } from '../../repositories/images';
import { onImagesChanged } from './carousel';
import { ignoreErrorCodes } from '../../utils/ignoreErrorCodes';
import { config } from '../../config';

export const deleteProcessor = async (id: Parameters<typeof deleteById>[0]) => {
    if (!deleteById(id)) return;

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
