import db from '../utils/db';

type ExtractRegion = {
    extract_left: number;
    extract_top: number;
    extract_width: number;
    extract_height: number;
}

export type ExtractRegionWithID = Prettify<{ id: number } & ExtractRegion>;
type ExtractRegionWithHash = Prettify<{ hash: Buffer } & ExtractRegion>;

const getByIDStmt = db.prepare<number, ExtractRegionWithHash>(`
    SELECT hash, extract_left, extract_top, extract_width, extract_height
    FROM images WHERE id = ?
`);

export const getByID = (id: number) => getByIDStmt.get(id);

const getByHashStmt = db.prepare<Buffer, ExtractRegionWithID>(`
    SELECT id, extract_left, extract_top, extract_width, extract_height
    FROM images WHERE hash = ?
`);

export const getByHash = (hash: Buffer) => getByHashStmt.get(hash);

const insertStmt = db.prepare<
    ExtractRegionWithHash,
    ExtractRegionWithID
>(`
    INSERT INTO images (
        hash, extract_left, extract_top, extract_width, extract_height
    ) VALUES (
        :hash, :extract_left, :extract_top, :extract_width, :extract_height
    ) ON CONFLICT(hash) DO NOTHING
    RETURNING id, extract_left, extract_top, extract_width, extract_height
`);

export const upsert = db.transaction((input: ExtractRegionWithHash) => {
    const record = insertStmt.get(input);
    
    if (record) {
        return {
            id: record.id,
            created: true,
            extract_left: record.extract_left,
            extract_top: record.extract_top,
            extract_width: record.extract_width,
            extract_height: record.extract_height,
        }
    } else {
        const existing = getByHash(input.hash);
        if (!existing) throw new Error("Database exception");

        return {
            id: existing.id,
            created: false,
            extract_left: existing.extract_left,
            extract_top: existing.extract_top,
            extract_width: existing.extract_width,
            extract_height: existing.extract_height,
        }
    }
}).immediate;

const updateOffsetStmt = db.prepare<{
    id: number;
    extract_left: number;
    extract_top: number;
}>(`
    UPDATE images SET extract_left = :extract_left, extract_top = :extract_top
    WHERE id = :id
`);

export const updateOffset = (input: {
    id: number;
    extract_left: number;
    extract_top: number;
}) => updateOffsetStmt.run(input).changes > 0;    

const deleteByIDStmt = db.prepare<number, Buffer>(`
    DELETE FROM images WHERE id = ? RETURNING hash
`).pluck();

export const deleteByID = (id: number) => deleteByIDStmt.get(id);
