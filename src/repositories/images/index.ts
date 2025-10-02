import db from '../../db';
import { toExtractRegionRecord, toInsert } from '../../models/images/repository';
import type { ImageInsert, ImageRecordDB, ExtractRegionRecordDB, ExtractOffsetUpdateDB } from '../../models/images/repository';
import type { Image, ImageRecord, ExtractRegionRecord, ExtractOffsetUpdate } from '../../models/images';

export { querySingle, queryList } from './query';

class DatabaseError extends Error {};

const getByHashStmt = db.prepare<ImageRecordDB['hash'], ExtractRegionRecordDB>(/* sql */`
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

const getByIDStmt = db.prepare<ImageRecordDB['id'], ExtractRegionRecordDB>(/* sql */`
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

const insertStmt = db.prepare<ImageInsert, ImageRecordDB['id']>(/* sql */`
    INSERT INTO images (
        hash,
        extract_region_left,
        extract_region_top,
        extract_region_width,
        extract_region_height,
        metadata_jsonb,
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
        jsonb(:metadata_jsonb),
        :place_name,
        :place_type,
        :place_fullName
    )
    ON CONFLICT(hash) DO NOTHING
    RETURNING id
`).pluck();

export const upsert = db.transaction((input: Image) => {
    const id = insertStmt.get(toInsert(input));
    if (id !== undefined) return { id, created: true };

    const record = getExtractRegionRecordByHash(input.hash);
    if (record) return { id: record.id, created: false };

    throw new DatabaseError()
});

const updateOffsetStmt = db.prepare<ExtractOffsetUpdateDB>(/* sql */`
    UPDATE images
    SET
        extract_region_left = :extract_region_left,
        extract_region_top = :extract_region_top
    WHERE id = :id
`);

export const updateOffset = (input: ExtractOffsetUpdate) =>
    updateOffsetStmt.run({
        id: input.id,
        extract_region_left: input.extractRegion.left,
        extract_region_top: input.extractRegion.top,
    }).changes > 0;

const deleteByIDStmt = db.prepare<ImageRecordDB['id']>(/* sql */`
    DELETE FROM images
    WHERE id = ?
`);

export const deleteByID = (id: ImageRecord['id']) =>
    deleteByIDStmt.run(id).changes > 0;
