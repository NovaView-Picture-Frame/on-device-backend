import { db } from "../../db";
import type { ImageRecordDB } from "../../models/images";

const listIdUnorderedStmt = db.prepare<[], ImageRecordDB["id"]>(/* sql */`
    SELECT id
    FROM images
`).pluck();

export const listIdUnordered = () => listIdUnorderedStmt.all();

const listIdByCreatedAscStmt = db.prepare<[], ImageRecordDB["id"]>(/* sql */`
    SELECT id
    FROM images
    ORDER BY created_at ASC
`).pluck();

const listIdByCreatedDescStmt = db.prepare<[], ImageRecordDB["id"]>(/* sql */`
    SELECT id
    FROM images
    ORDER BY created_at DESC
`).pluck();

export const listIdByCreated = (ascending = false) =>
    ascending ? listIdByCreatedAscStmt.all() : listIdByCreatedDescStmt.all();

const listIdByTakenAscStmt = db.prepare<[], ImageRecordDB["id"]>(/* sql */`
    SELECT id
    FROM images
    ORDER BY COALESCE(_taken_at, created_at) ASC
`).pluck();

const listIdByTakenDescStmt = db.prepare<[], ImageRecordDB["id"]>(/* sql */`
    SELECT id
    FROM images
    ORDER BY COALESCE(_taken_at, created_at) DESC
`).pluck();

export const listIdByTaken = (ascending = false) =>
    ascending ? listIdByTakenAscStmt.all() : listIdByTakenDescStmt.all();
