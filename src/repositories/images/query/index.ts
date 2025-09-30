import { buildFields, toImageQuery } from './fields';
import db from '../../../db';

import type { ImageRecordDB, ImageSelect } from '../../../models/images/repository';
import type { ImageRecord } from '../../../models/images';
import type { FieldsSelection, ImageQuery } from '../../../models/images/query';

const buildSingleDStmt = (select: FieldsSelection) => {
    const fields = buildFields(select);

    return db.prepare<ImageRecordDB['id'], ImageSelect>(/* sql */`
        SELECT ${fields.join(', ')}
        FROM images
        WHERE id = ?
    `);
};

export const querySingle = (
    id: ImageRecord['id'],
    select: FieldsSelection
): ImageQuery | null => {
    const record = buildSingleDStmt(select).get(id);
    return record ? toImageQuery(record, select) : null;
};

const buildListStmt = (select: FieldsSelection) => {
    const fields = buildFields(select);

    return db.prepare<
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
};

export const queryList = (
    select: FieldsSelection,
    size: number,
    cursor?: ImageRecord['id'],
): ImageQuery[] => {
    const records = buildListStmt(select).all({
        size,
        cursor: cursor ?? null,
    });

    return records.map(record => toImageQuery(record, select));
};
