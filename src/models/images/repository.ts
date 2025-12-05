import type { Image, ExtractRegionRecord } from './base';

export interface ImageInsert {
    hash: string;
    extract_region_left: number;
    extract_region_top: number;
    extract_region_width: number;
    extract_region_height: number;
    metadata_jsonb: string;
    place_name: string | null;
    place_type: string | null;
    place_full_name: string | null;
};

export interface ImageRecordDB extends ImageInsert {
    id: number;
};

export type ExtractRegionRecordDB = Pick<ImageRecordDB, 'id' | 'extract_region_left' | 'extract_region_top' | 'extract_region_width' | 'extract_region_height'>;
export type ExtractOffsetUpdateDB = Pick<ImageRecordDB, 'id' | 'extract_region_left' | 'extract_region_top'>;

export interface ImageSelect extends Omit<ImageRecordDB, 'metadata_jsonb'> {
    metadata_json: string
};

export const toInsert = (input: Image): ImageInsert => ({
    hash: input.hash,
    extract_region_left: input.extractRegion.left,
    extract_region_top: input.extractRegion.top,
    extract_region_width: input.extractRegion.width,
    extract_region_height: input.extractRegion.height,
    metadata_jsonb: JSON.stringify(input.metadata),

    ...(input.place !== null ? {
        place_name: input.place.name,
        place_type: input.place.type,
        place_full_name: input.place.fullName,
    } : {
        place_name: null,
        place_type: null,
        place_full_name: null,
    })
});

export const toExtractRegionRecord = (input: ExtractRegionRecordDB): ExtractRegionRecord => ({
    id: input.id,
    extractRegion: {
        left: input.extract_region_left,
        top: input.extract_region_top,
        width: input.extract_region_width,
        height: input.extract_region_height,
    },
});
