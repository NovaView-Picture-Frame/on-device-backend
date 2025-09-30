import type { Image, ExtractRegionRecord } from '.';

export interface ImageInsert {
    hash: string;
    extract_region_left: number;
    extract_region_top: number;
    extract_region_width: number;
    extract_region_height: number;
    exif_jsonb: string | null;
    place_name: string | null;
    place_type: string | null;
    place_fullName: string | null;
};

export interface ImageRecordDB extends ImageInsert {
    id: number;
};

export type ExtractRegionRecordDB = Pick<ImageRecordDB, 'id' | 'extract_region_left' | 'extract_region_top' | 'extract_region_width' | 'extract_region_height'>;
export type ExtractOffsetUpdateDB = Pick<ImageRecordDB, 'id' | 'extract_region_left' | 'extract_region_top'>;

export type ImageSelect = Omit<ImageRecordDB, 'exif_jsonb'> & {
    [key: `exif_${string}`]: string | number | null;
};

export const toInsert = (input: Image): ImageInsert => ({
    hash: input.hash,
    extract_region_left: input.extractRegion.left,
    extract_region_top: input.extractRegion.top,
    extract_region_width: input.extractRegion.width,
    extract_region_height: input.extractRegion.height,

    exif_jsonb: input.exif !== null
        ? JSON.stringify(input.exif)
        : null,

    ...(input.place !== null ? {
        place_name: input.place.name,
        place_type: input.place.type,
        place_fullName: input.place.fullName,
    } : {
        place_name: null,
        place_type: null,
        place_fullName: null,
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
