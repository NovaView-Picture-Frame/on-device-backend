import db from '../utils/db';
import { toExtractRegionRecord, toNewImageDB } from '../models/image-db';
import type { ExtractOffsetDB, ExtractRegionDB, ImageDB } from '../models/image-db';
import type { ExtractOffsetUpdate, ExtractRegionRecord, Image } from '../models/image';

class DatabaseError extends Error {};

const getByHashStmt = db.prepare<ImageDB['hash'], ExtractRegionDB>(`
    SELECT
        id,
        extract_region_left,
        extract_region_top,
        extract_region_width,
        extract_region_height
    FROM images
    WHERE hash = ?
`);

export const getByHash =(hash: Image['hash']): ExtractRegionRecord | null => {
    const record = getByHashStmt.get(hash);
    return record ? toExtractRegionRecord(record) : null;
};

const getByIDStmt = db.prepare<ImageDB['id'], ExtractRegionDB>(`
    SELECT
        id,
        extract_region_left,
        extract_region_top,
        extract_region_width,
        extract_region_height
    FROM images
    WHERE id = ?
`);

export const getByID =(id: Image['id']): ExtractRegionRecord | null => {
    const record = getByIDStmt.get(id);
    return record ? toExtractRegionRecord(record) : null;
};

const insertStmt = db.prepare<Omit<ImageDB, 'id'>, ImageDB['id']>(`
    INSERT INTO images (
        hash,
        extract_region_left,
        extract_region_top,
        extract_region_width,
        extract_region_height,
        exif_jsonb,
        place_jsonb
    )
    VALUES (
        :hash,
        :extract_region_left,
        :extract_region_top,
        :extract_region_width,
        :extract_region_height,
        jsonb(:exif_jsonb),
        jsonb(:place_jsonb)
    )
    ON CONFLICT(hash) DO NOTHING
    RETURNING id
`).pluck();

export const upsert = db.transaction((input: Omit<Image, 'id'>) => {
    const id = insertStmt.get(toNewImageDB(input));
    if (id) return { id, created: true };

    const record = getByHash(input.hash);
    if (record) return { id: record.id, created: false };

    throw new DatabaseError()
});

const updateOffsetStmt = db.prepare<ExtractOffsetDB>(`
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
        cursor: ImageDB['id'] | null;
    },
    ExtractRegionDB
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
    cursor?: Image['id']
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

const deleteByIDStmt = db.prepare<ImageDB['id']>(`
    DELETE FROM images
    WHERE id = ?
`);

export const deleteByID = (id: Image['id']) =>
    deleteByIDStmt.run(id).changes > 0;
