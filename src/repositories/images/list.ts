import { db } from "../../db";
import type { SlotImageDB } from "../../models/images";

const listIdAndRevisionUnorderedStmt = db.prepare<[], SlotImageDB>(/* sql */`
    SELECT id, _revision
    FROM images
`);

export const listIdAndRevisionUnordered = () => listIdAndRevisionUnorderedStmt.all();

const listIdAndRevisionByCreatedAscStmt = db.prepare<[], SlotImageDB>(/* sql */`
    SELECT id, _revision
    FROM images
    ORDER BY created_at ASC
`);

const listIdAndRevisionByCreatedDescStmt = db.prepare<[], SlotImageDB>(/* sql */`
    SELECT id, _revision
    FROM images
    ORDER BY created_at DESC
`);

export const listIdAndRevisionByCreated = (ascending = false) =>
    ascending ? listIdAndRevisionByCreatedAscStmt.all() : listIdAndRevisionByCreatedDescStmt.all();

const listIdAndRevisionByTakenAscStmt = db.prepare<[], SlotImageDB>(/* sql */`
    SELECT id, _revision
    FROM images
    ORDER BY COALESCE(_taken_at, created_at) ASC
`);

const listIdAndRevisionByTakenDescStmt = db.prepare<[], SlotImageDB>(/* sql */`
    SELECT id, _revision
    FROM images
    ORDER BY COALESCE(_taken_at, created_at) DESC
`);

export const listIdAndRevisionByTaken = (ascending = false) =>
    ascending ? listIdAndRevisionByTakenAscStmt.all() : listIdAndRevisionByTakenDescStmt.all();
