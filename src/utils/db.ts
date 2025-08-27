import Database from 'better-sqlite3';
import config from './config';

const NAME = 'images';

const db: InstanceType<typeof Database> = new Database(
    `${config.paths._base}/${NAME}.db`, {
        nativeBinding: `${import.meta.dirname}/node_modules/better-sqlite3/better_sqlite3.node`,
    }
);

db.exec(`
    CREATE TABLE IF NOT EXISTS ${NAME} (
        id INTEGER PRIMARY KEY,
        hash BLOB NOT NULL UNIQUE CHECK(length(hash)=32),
        extract_left INTEGER NOT NULL CHECK(extract_left >= 0),
        extract_top INTEGER NOT NULL CHECK(extract_top >= 0),
        extract_width INTEGER NOT NULL CHECK(extract_width > 0),
        extract_height INTEGER NOT NULL CHECK(extract_height > 0),
        extract_offset_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        CHECK(extract_left = 0 OR extract_top = 0)
    );

    CREATE TRIGGER IF NOT EXISTS ${NAME}_update_extract_offset_updated_at
    AFTER UPDATE OF extract_left, extract_top ON ${NAME}
    WHEN NEW.extract_left != OLD.extract_left OR NEW.extract_top != OLD.extract_top
    BEGIN
    UPDATE ${NAME}
        SET extract_offset_updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;
`);

export default db
