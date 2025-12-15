import Database from "better-sqlite3";

import { appConfig, paths } from "./config";

export const db = new Database(`${paths._base}/${appConfig.server.database}`, {
    nativeBinding: `${import.meta.dirname}/node_modules/better-sqlite3/better_sqlite3.node`,
});

db.exec(/* sql */ `
    CREATE TABLE IF NOT EXISTS images (
        id                     INTEGER  PRIMARY KEY  AUTOINCREMENT,
        hash                   TEXT     NOT NULL     UNIQUE         CHECK(length(hash) = 64),

        extract_region_left    INTEGER  NOT NULL                    CHECK(extract_region_left >= 0),
        extract_region_top     INTEGER  NOT NULL                    CHECK(extract_region_top >= 0),
        extract_region_width   INTEGER  NOT NULL                    CHECK(extract_region_width > 0),
        extract_region_height  INTEGER  NOT NULL                    CHECK(extract_region_height > 0),

        metadata_jsonb         BLOB     NOT NULL                    CHECK(json_valid(metadata_jsonb, 8) AND json_type(metadata_jsonb) = "object" AND json(metadata_jsonb) != "{}"),
        _taken_at              TEXT AS (
            datetime(
                replace(substr(json_extract(metadata_jsonb, "$.DateTimeOriginal"), 1, 10), ":", "-") 
                || " " ||
                substr(json_extract(metadata_jsonb, "$.DateTimeOriginal"), 12)
            )
        ) STORED,

        place_name             TEXT,
        place_type             TEXT,
        place_full_name        TEXT,
        _place_exists          INTEGER AS (
            place_name IS NOT NULL AND place_type IS NOT NULL AND place_full_name IS NOT NULL
        ) STORED,

        created_at             TEXT     NOT NULL                    DEFAULT CURRENT_TIMESTAMP,

        CHECK(extract_region_left = 0 OR extract_region_top = 0),
        CHECK(extract_region_width = ${appConfig.device.screen.width} OR extract_region_height = ${appConfig.device.screen.height}),
        CHECK(
            extract_region_left + ${appConfig.device.screen.width} <= extract_region_width OR
            extract_region_top  + ${appConfig.device.screen.height} <= extract_region_height
        ),

        CHECK (
            _place_exists
            OR (
                place_name IS NULL
                AND place_type IS NULL
                AND place_full_name IS NULL
            )
        )
    ) STRICT;
`);

db.pragma("journal_mode = WAL");
