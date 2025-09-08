import Database from 'better-sqlite3';
import config from './config';

const db: InstanceType<typeof Database> = new Database(
    `${config.paths._base}/${config.database}`, {
        nativeBinding: `${import.meta.dirname}/node_modules/better-sqlite3/better_sqlite3.node`,
    }
);

db.exec(`
    CREATE TABLE IF NOT EXISTS images (
        id              INTEGER  PRIMARY KEY  AUTOINCREMENT,
        hash            BLOB     NOT NULL     UNIQUE         CHECK(length(hash) = 32),
        extract_left    INTEGER  NOT NULL                    CHECK(extract_left >= 0),
        extract_top     INTEGER  NOT NULL                    CHECK(extract_top >= 0),
        extract_width   INTEGER  NOT NULL                    CHECK(extract_width > 0),
        extract_height  INTEGER  NOT NULL                    CHECK(extract_height > 0),

        CHECK(extract_left = 0 OR extract_top = 0),
        CHECK(extract_width = ${config.screenWidth} OR extract_height = ${config.screenHeight})
    ) STRICT;
`);

db.pragma('journal_mode = WAL');

export default db;
