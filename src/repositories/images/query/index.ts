import { db } from "../../../db";
import { buildSelector } from "./selector";

import type { ImageRecord, ImageRecordDB } from "../../../models/images";
import type { Selection } from "../../../graphql/models/images";

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

    const placeholders = Array(ids.length).fill("?").join(", ");

    const stmt = db.prepare<number[], string>(/* sql */ `
        SELECT ${buildSelector(selection)}
        FROM images
        WHERE id IN (${placeholders})
    `).pluck();

    const results = stmt.all(...ids);
    return JSON.parse(`[${results.join(",")}]`);
};
