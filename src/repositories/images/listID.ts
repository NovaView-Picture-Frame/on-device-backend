import db from '../../db';
import type { ImageRecordDB } from '../../models/images';

const listIDStmt = db.prepare<[], ImageRecordDB['id']>(/* sql */`
    SELECT id
    FROM images
`).pluck();

export const listID = () => listIDStmt.all();

const listIDByCreatedAscStmt = db.prepare<[], ImageRecordDB['id']>(/* sql */`
    SELECT id
    FROM images
    ORDER BY created_at ASC
`).pluck();

const listIDByCreatedDescStmt = db.prepare<[], ImageRecordDB['id']>(/* sql */`
    SELECT id
    FROM images
    ORDER BY created_at DESC
`).pluck();

export const listIDByCreated = (ascending = false) =>
    ascending ? listIDByCreatedAscStmt.all() : listIDByCreatedDescStmt.all();

const listIDByTakenAscStmt = db.prepare<[], ImageRecordDB['id']>(/* sql */`
    SELECT id
    FROM images
    ORDER BY COALESCE(_taken_at, created_at) ASC
`).pluck();

const listIDByTakenDescStmt = db.prepare<[], ImageRecordDB['id']>(/* sql */`
    SELECT id
    FROM images
    ORDER BY COALESCE(_taken_at, created_at) DESC
`).pluck();

export const listIDByTaken = (ascending = false) =>
    ascending ? listIDByTakenAscStmt.all() : listIDByTakenDescStmt.all();
