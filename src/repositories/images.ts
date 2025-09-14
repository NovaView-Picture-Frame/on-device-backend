import db from '../utils/db';

export interface ExtractOffset {
    extract_left: number;
    extract_top: number;
}

export interface ExtractRegion extends ExtractOffset {
    extract_width: number;
    extract_height: number;
}

interface NewImage extends ExtractRegion {
    hash: Buffer;
    exif: { [key: string]: string | undefined };
}

type ImageRow = Omit<NewImage, 'exif'> & { exif_json: string };

interface ImageRecord extends ImageRow {
    id: number;
}

export type ExtractOffsetWithID = Pick<ImageRecord, 'id' | 'extract_left' | 'extract_top'>;
type ExtractRegionWithID = Pick<ImageRecord, 'id' | 'extract_left' | 'extract_top' | 'extract_width' | 'extract_height'>;

class DatabaseError extends Error {};

const getByHashStmt = db.prepare<NewImage['hash'], ExtractRegionWithID>(`
    SELECT
        id,
        extract_left,
        extract_top,
        extract_width,
        extract_height
    FROM images
    WHERE hash = ?
`);

export const getByHash = (hash: Parameters<typeof getByHashStmt.get>[0]) => getByHashStmt.get(hash);

const getByIDStmt = db.prepare<ImageRecord['id'], ExtractRegionWithID>(`
    SELECT
        id,
        extract_left,
        extract_top,
        extract_width,
        extract_height
    FROM images
    WHERE id = ?
`);

export const getByID = (id: Parameters<typeof getByIDStmt.get>[0]) => getByIDStmt.get(id);

const insertStmt = db.prepare<ImageRow, ImageRecord['id']>(`
    INSERT INTO images (
        hash,
        extract_left,
        extract_top,
        extract_width,
        extract_height,
        exif_jsonb
    )
    VALUES (
        :hash,
        :extract_left,
        :extract_top,
        :extract_width,
        :extract_height,
        jsonb(:exif_json)
    )
    ON CONFLICT(hash) DO NOTHING
    RETURNING id
`).pluck();

export const upsert = db.transaction((input: NewImage) => {
    const { exif, ...rest } = input;
    const id = insertStmt.get({
        ...rest,
        exif_json: JSON.stringify(exif),
    });
    if (id) return { id, created: true };

    const record = getByHash(input.hash);
    if (record) return { id: record.id, created: false };

    throw new DatabaseError()
});

const updateOffsetStmt = db.prepare<ExtractOffsetWithID>(`
    UPDATE images
    SET
        extract_left = :extract_left,
        extract_top = :extract_top
    WHERE id = :id
`);

export const updateOffset = (input: Parameters<typeof updateOffsetStmt.run>[0]) =>
    updateOffsetStmt.run(input).changes > 0;

const listStmt = db.prepare<
    { cursor: ImageRecord['id'] | null; size: number },
    ExtractRegionWithID
>(`
    SELECT
        id,
        extract_left,
        extract_top,
        extract_width,
        extract_height
    FROM images
    WHERE (:cursor IS NULL OR id < :cursor)
    ORDER BY id DESC
    LIMIT :size
`);

export const list = (input: Parameters<typeof listStmt.all>[0]) => listStmt.all(input);

const deleteByIDStmt = db.prepare<ImageRecord['id']>(`
    DELETE FROM images
    WHERE id = ?
`);

export const deleteByID = (id: Parameters<typeof deleteByIDStmt.run>[0]) =>
    deleteByIDStmt.run(id).changes > 0;
