import type { ExtractRegionRecord, Image } from '../models/image';

export interface ExtractOffsetDB {
    id: number;
    extract_region_left: number;
    extract_region_top: number;
}

export interface ExtractRegionDB extends ExtractOffsetDB {
    extract_region_width: number;
    extract_region_height: number;
}

export interface ImageDB extends ExtractRegionDB {
    id: number;
    hash: Buffer;
    exif_jsonb: string | null;
    place_jsonb: string | null;
}

export const toNewImageDB = (input: Omit<Image, 'id'>): Omit<ImageDB, 'id'> => ({
    hash: input.hash,
    extract_region_left: input.extractRegion.left,
    extract_region_top: input.extractRegion.top,
    extract_region_width: input.extractRegion.width,
    extract_region_height: input.extractRegion.height,
    exif_jsonb: JSON.stringify(
        input.exif,
        (_, value) => value === null ? undefined : value
    ),
    place_jsonb: JSON.stringify(input.place),
});

export const toExtractRegionRecord = (input: ExtractRegionDB): ExtractRegionRecord => ({
    id: input.id,
    extractRegion: {
        left: input.extract_region_left,
        top: input.extract_region_top,
        width: input.extract_region_width,
        height: input.extract_region_height,
    },
});
