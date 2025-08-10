import db from '../utils/db.js';

const insertStmt = db.prepare(`
    INSERT INTO images (sha256) VALUES (?)
    ON CONFLICT(sha256) DO NOTHING
    RETURNING id
`).pluck();

const getIdStmt = db.prepare(
    'SELECT id FROM images WHERE sha256 = ?'
).pluck();

export const insert: (sha256: Buffer) => { id: number; inserted: boolean } =
    db.transaction(sha256 => {
        const id = insertStmt.get(sha256) as number | undefined;
        return id !== undefined
            ? {
                id,
                inserted: true
            }
            : {
                id: getIdStmt.get(sha256) as number,
                inserted: false
            };
    }).immediate;

export const getId = (sha256: Buffer) =>
    getIdStmt.get(sha256) as number | undefined;
