import Database from 'better-sqlite3';

import config from './config';

const db = new Database(
    `${config.paths._base}/${config.database}`, {
        nativeBinding: `${import.meta.dirname}/node_modules/better-sqlite3/better_sqlite3.node`,
    }
);

db.exec(`
    CREATE TABLE IF NOT EXISTS images (
        id                     INTEGER  PRIMARY KEY  AUTOINCREMENT,
        hash                   BLOB     NOT NULL     UNIQUE         CHECK(length(hash) = 32),
        extract_region_left    INTEGER  NOT NULL                    CHECK(extract_region_left >= 0),
        extract_region_top     INTEGER  NOT NULL                    CHECK(extract_region_top >= 0),
        extract_region_width   INTEGER  NOT NULL                    CHECK(extract_region_width > 0),
        extract_region_height  INTEGER  NOT NULL                    CHECK(extract_region_height > 0),
        exif_jsonb             BLOB                                 CHECK(json_valid(exif_jsonb, 8) AND json_type(exif_jsonb) = 'object' AND json(exif_jsonb) != '{}'),
        place_name             TEXT,
        place_type             TEXT,
        place_fullName         TEXT,

        CHECK(extract_region_left = 0 OR extract_region_top = 0),
        CHECK(extract_region_width = ${config.screenWidth} OR extract_region_height = ${config.screenHeight}),
        CHECK (
            (place_name IS NULL AND place_type IS NULL AND place_fullName IS NULL)
            OR
            (place_name IS NOT NULL AND place_type IS NOT NULL AND place_fullName IS NOT NULL)
        )
    ) STRICT;
`);

db.pragma('journal_mode = WAL');

export default db;
