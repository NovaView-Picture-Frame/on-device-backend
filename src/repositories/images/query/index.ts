import buildFieldsAndResolver from './mapper';
import db from '../../../db';

import type { ImageRecord } from '../../../models/images';
import type { Selection, ImageQuery } from '../../../models/images/query';
import type { ImageRecordDB, ImageSelect } from '../../../models/images/repository';

export const querySingle = (
    id: ImageRecord['id'],
    selection: Selection
): ImageQuery | null => {
    const { fields, resolver } = buildFieldsAndResolver(selection);
    const stmt = db.prepare<ImageRecordDB['id'], ImageSelect>(/* sql */`
        SELECT ${fields.join(', ')}
        FROM images
        WHERE id = ?
    `);

    const record = stmt.get(id);
    return record ? resolver(record) : null;
}

export const queryList = (
    size: number,
    selection: Selection,
    cursor?: ImageRecord['id'],
): ImageQuery[] => {
    const { fields, resolver } = buildFieldsAndResolver(selection);
    const stmt = db.prepare<
        {
            size: number;
            cursor: ImageRecordDB['id'] | null
        },
        ImageSelect
    >(/* sql */`
        SELECT ${fields.join(', ')}
        FROM images
        WHERE (:cursor IS NULL OR id < :cursor)
        ORDER BY id DESC
        LIMIT :size
    `);

    const records = stmt.all({
        size,
        cursor: cursor ?? null,
    });
    return records.map(resolver);
}
