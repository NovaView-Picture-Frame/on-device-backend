import db from '../utils/db';

const getByHashStmt = db.prepare<
    Buffer,
    { id: number; cover_left: number; cover_top: number }
>(`
    SELECT id, cover_left, cover_top FROM images WHERE sha256 = ?
`);

export const getByHash = (hash: Buffer) => getByHashStmt.get(hash);

const insertStmt = db.prepare<
    { hash: Buffer, cover_left: number, cover_top: number },
    { id: number, cover_left: number, cover_top: number }
>(`
    INSERT INTO images (
        sha256, cover_left, cover_top
    ) VALUES (:hash, :cover_left, :cover_top)
    ON CONFLICT(sha256) DO NOTHING
    RETURNING id, cover_left, cover_top
`);

export const upsert = db.transaction((
    hash: Buffer,
    cover_left: number,
    cover_top: number,
) => {
    const record = insertStmt.get({ hash, cover_left, cover_top });
    
    if (record) {
        return {
            id: record.id,
            created: true,
            cover_left: record.cover_left,
            cover_top: record.cover_top,
        }
    } else {
        const existing = getByHash(hash);
        if (!existing) throw new Error("Database exception");

        return {
            id: existing.id,
            created: false,
            cover_left: existing.cover_left,
            cover_top: existing.cover_top,
        }
    }
}).immediate;
