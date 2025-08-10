import Database from 'better-sqlite3';
import config from './config.js';

const NAME = 'images';

const db: InstanceType<typeof Database> = new Database(
    `${config.work_directory}/${NAME}.db`,
    {
        nativeBinding: `${import.meta.dirname}/dependencies/better_sqlite3.node`,
    }
);

db.prepare(`
    CREATE TABLE IF NOT EXISTS ${NAME} (
        id INTEGER PRIMARY KEY,
        sha256 BLOB NOT NULL UNIQUE CHECK(length(sha256)=32)
    )
`).run();

export default db
