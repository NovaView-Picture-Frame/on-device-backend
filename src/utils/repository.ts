import db from './db';

export interface ExtractRegion {
    extract_left: number;
    extract_top: number;
    extract_width: number;
    extract_height: number;
}

interface NewImage extends ExtractRegion {
    hash: Buffer;
}

interface ImageRecord extends NewImage {
    id: number;
}

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

const insertStmt = db.prepare<NewImage, ImageRecord['id']>(`
    INSERT INTO images (
        hash,
        extract_left,
        extract_top,
        extract_width,
        extract_height
    )
    VALUES (
        :hash,
        :extract_left,
        :extract_top,
        :extract_width,
        :extract_height
    )
    ON CONFLICT(hash) DO NOTHING
    RETURNING id
`).pluck();

export const upsert = db.transaction((image: Parameters<typeof insertStmt.get>[0]) => {
    const id = insertStmt.get(image);
    if (id) return { id, created: true };

    const record = getByHash(image.hash);
    if (record) return { id: record.id, created: false };

    throw new DatabaseError()
});

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
    WHERE (:cursor IS NULL OR id > :cursor)
    ORDER BY id DESC
    LIMIT :size
`);

export const list = (input: Parameters<typeof listStmt.all>[0]) => listStmt.all(input);
