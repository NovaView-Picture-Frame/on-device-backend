import { db } from '../../../db';
import { buildSelector} from './selector';

import type {
    ImageRecord,
    Selection,
    ImageRecordDB,
} from '../../../models/images';

export const querySingle = (
    id: ImageRecord['id'],
    selection: Selection
) => {
    const stmt = db.prepare<ImageRecordDB['id'], string>(/* sql */`
        SELECT ${buildSelector(selection)}
        FROM images
        WHERE id = ?
    `).pluck();
    
    const result = stmt.get(id);
    return result ? JSON.parse(result) : null;
}

export const queryList = (
    size: number,
    selection: Selection,
    cursor?: ImageRecord['id'],
) => {
    const stmt = db.prepare<
        {
            size: number;
            cursor: ImageRecordDB['id'] | null
        },
        string
    >(/* sql */`
        SELECT ${buildSelector(selection)}
        FROM images
        WHERE (:cursor IS NULL OR id < :cursor)
        ORDER BY id DESC
        LIMIT :size
    `).pluck();

    const results = stmt.all({
        size,
        cursor: cursor ?? null,
    });
    return JSON.parse(`[${results.join(',')}]`);
}
