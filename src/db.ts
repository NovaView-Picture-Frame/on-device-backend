import Database from 'better-sqlite3';

import config from './config';

const db = new Database(
    `${config.paths._base}/${config.database}`, {
        nativeBinding: `${import.meta.dirname}/node_modules/better-sqlite3/better_sqlite3.node`,
    }
);

db.exec(/* sql */`
    CREATE TABLE IF NOT EXISTS images (
        id                     INTEGER  PRIMARY KEY  AUTOINCREMENT,
        hash                   TEXT     NOT NULL     UNIQUE         CHECK(length(hash) = 64),
        extract_region_left    INTEGER  NOT NULL                    CHECK(extract_region_left >= 0),
        extract_region_top     INTEGER  NOT NULL                    CHECK(extract_region_top >= 0),
        extract_region_width   INTEGER  NOT NULL                    CHECK(extract_region_width > 0),
        extract_region_height  INTEGER  NOT NULL                    CHECK(extract_region_height > 0),
        metadata_jsonb         BLOB     NOT NULL                    CHECK(json_valid(metadata_jsonb, 8) AND json_type(metadata_jsonb) = 'object' AND json(metadata_jsonb) != '{}'),
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
