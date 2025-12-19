import { db } from "../../../db";
import { buildSelector } from "./selector";

import type { ImageRecord, ImageRecordDB, Selection } from "../../../models/images";

export const querySingle = (id: ImageRecord["id"], selection: Selection) => {
    const stmt = db.prepare<ImageRecordDB["id"], string>(/* sql */ `
        SELECT ${buildSelector(selection)}
        FROM images
        WHERE id = ?
    `).pluck();

    const result = stmt.get(id);
    return result ? JSON.parse(result) : null;
};

export const queryList = (input: {
    size: number;
    selection: Selection;
    cursor: ImageRecord["id"] | null;
}) => {
    const stmt = db.prepare<
        {
            size: number;
            cursor: ImageRecordDB["id"] | null;
        },
        string
    >(/* sql */`
        SELECT ${buildSelector(input.selection)}
        FROM images
        WHERE (:cursor IS NULL OR id < :cursor)
        ORDER BY id DESC
        LIMIT :size
    `).pluck();

    const results = stmt.all({
        size: input.size,
        cursor: input.cursor,
    });
    return JSON.parse(`[${results.join(",")}]`);
};

export const queryByIds = (ids: ImageRecord["id"][], selection: Selection) => {
    if (ids.length === 0) return [];

    const values = ids.reduce((acc, _, index) => {
        const entry = `(?, ${index})`;
        return acc + (index ? ", " : "") + entry;
    }, "");

    const stmt = db.prepare<number[], string>(/* sql */ `
        WITH requested(request_id, ord) AS (
            VALUES ${values}
        )
        SELECT
            CASE
                WHEN images.id IS NULL THEN 'null'
                ELSE ${buildSelector(selection)}
            END
        FROM requested
        LEFT JOIN images
            ON images.id = requested.request_id
        ORDER BY requested.ord
    `)
    .pluck();

    const results = stmt.all(...ids);
    return JSON.parse(`[${results.join(",")}]`);
};
