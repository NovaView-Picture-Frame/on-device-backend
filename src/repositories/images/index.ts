import db from '../../utils/db';
import { toExtractRegionRecord, toInsert } from '../../models/image-db';
import type { ImageInsertDB, ImageRecordDB, ExtractRegionRecordDB, ExtractOffsetUpdateDB } from '../../models/image-db';
import type { Image, ImageRecord, ExtractRegionRecord, ExtractOffsetUpdate } from '../../models/image';

class DatabaseError extends Error {};

const getByHashStmt = db.prepare<ImageRecordDB['hash'], ExtractRegionRecordDB>(`
    SELECT
        id,
        extract_region_left,
        extract_region_top,
        extract_region_width,
        extract_region_height
    FROM images
    WHERE hash = ?
`);

export const getExtractRegionRecordByHash =(hash: ImageRecord['hash']): ExtractRegionRecord | null => {
    const record = getByHashStmt.get(hash);
    return record ? toExtractRegionRecord(record) : null;
};

const getByIDStmt = db.prepare<ImageRecordDB['id'], ExtractRegionRecordDB>(`
    SELECT
        id,
        extract_region_left,
        extract_region_top,
        extract_region_width,
        extract_region_height
    FROM images
    WHERE id = ?
`);

export const getExtractRegionRecordByID =(id: ImageRecord['id']): ExtractRegionRecord | null => {
    const record = getByIDStmt.get(id);
    return record ? toExtractRegionRecord(record) : null;
};

const insertStmt = db.prepare<ImageInsertDB, ImageRecordDB['id']>(`
    INSERT INTO images (
        hash,
        extract_region_left,
        extract_region_top,
        extract_region_width,
        extract_region_height,
        exif_jsonb,
        place_name,
        place_type,
        place_fullName
    )
    VALUES (
        :hash,
        :extract_region_left,
        :extract_region_top,
        :extract_region_width,
        :extract_region_height,
        jsonb(:exif_jsonb),
        :place_name,
        :place_type,
        :place_fullName
    )
    ON CONFLICT(hash) DO NOTHING
    RETURNING id
`).pluck();

export const upsert = db.transaction((input: Image) => {
    const id = insertStmt.get(toInsert(input));
    if (id) return { id, created: true };

    const record = getExtractRegionRecordByHash(input.hash);
    if (record) return { id: record.id, created: false };

    throw new DatabaseError()
});

const updateOffsetStmt = db.prepare<ExtractOffsetUpdateDB>(`
    UPDATE images
    SET
        extract_region_left = :extract_region_left,
        extract_region_top = :extract_region_top
    WHERE id = :id
`);

export const updateOffset = (input: ExtractOffsetUpdate) =>
    updateOffsetStmt.run({
        id: input.id,
        extract_region_left: input.left,
        extract_region_top: input.top,
    }).changes > 0;

const listStmt = db.prepare<
    {
        size: number;
        cursor: ImageRecordDB['id'] | null;
    },
    ExtractRegionRecordDB
>(`
    SELECT
        id,
        extract_region_left,
        extract_region_top,
        extract_region_width,
        extract_region_height
    FROM images
    WHERE (:cursor IS NULL OR id < :cursor)
    ORDER BY id DESC
    LIMIT :size
`);

export const list = (
    size: number,
    cursor?: ImageRecord['id']
): ExtractRegionRecord[] =>
    listStmt.all({ size, cursor: cursor ?? null }).map(record => ({
        id: record.id,
        extractRegion: {
            left: record.extract_region_left,
            top: record.extract_region_top,
            width: record.extract_region_width,
            height: record.extract_region_height,
        },
    }));

const deleteByIDStmt = db.prepare<ImageRecordDB['id']>(`
    DELETE FROM images
    WHERE id = ?
`);

export const deleteByID = (id: ImageRecord['id']) =>
    deleteByIDStmt.run(id).changes > 0;
