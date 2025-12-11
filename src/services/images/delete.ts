import fs from 'node:fs/promises';

import { deleteById } from '../../repositories/images';
import { onImagesChanged } from './carousel';
import { ignoreErrorCodes } from '../../utils/ignoreErrorCodes';
import { paths } from '../../config';

export const deleteProcessor = async (id: Parameters<typeof deleteById>[0]) => {
    if (!deleteById(id)) return;

    onImagesChanged();
    await Promise.all(ignoreErrorCodes(
        [
            `${paths.originals._base}/${id}`,
            `${paths.cropped._base}/${id}`,
            `${paths.optimized._base}/${id}`,
        ].map(fs.unlink),
        'ENOENT',
    ))
}
