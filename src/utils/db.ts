import Database from 'better-sqlite3';
import config from './config';

const NAME = 'images';

const db: InstanceType<typeof Database> = new Database(
    `${config.paths._base}/${NAME}.db`, {
        nativeBinding: `${import.meta.dirname}/node_modules/better-sqlite3/better_sqlite3.node`,
    }
);

db.prepare(`
    CREATE TABLE IF NOT EXISTS ${NAME} (
        id INTEGER PRIMARY KEY,
        sha256 BLOB NOT NULL UNIQUE CHECK(length(sha256)=32),
        cover_left INTEGER NOT NULL CHECK(cover_left >= 0),
        cover_top INTEGER NOT NULL CHECK(cover_top >= 0),
        CHECK(cover_left = 0 OR cover_top = 0)
    )
`).run();

export default db
