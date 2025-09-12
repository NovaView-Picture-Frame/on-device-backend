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

interface ImageRecord extends ExtractRegion {
    id: number;
}

class DatabaseError extends Error {};

const getByHashStmt = db.prepare<Buffer, ImageRecord>(`
    SELECT
        id,
        extract_left,
        extract_top,
        extract_width,
        extract_height
    FROM images
    WHERE hash = ?
`);

export const getByHash = (hash: Buffer) => getByHashStmt.get(hash);

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

export const upsert = db.transaction((image: NewImage) => {
    const id = insertStmt.get(image);
    if (id) return { id, created: true };

    const record = getByHash(image.hash);
    if (record) return { id: record.id, created: false };

    throw new DatabaseError()
});
