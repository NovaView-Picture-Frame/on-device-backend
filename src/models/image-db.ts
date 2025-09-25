import type { Image, ExtractRegionRecord } from './image';

export interface ImageInsertDB {
    hash: Buffer;
    extract_region_left: number;
    extract_region_top: number;
    extract_region_width: number;
    extract_region_height: number;
    exif_jsonb: string | null;
    place_name: string | null;
    place_type: string | null;
    place_fullName: string | null;
};

export interface ImageRecordDB extends ImageInsertDB {
    id: number;
};

export type ExtractRegionRecordDB = Pick<ImageRecordDB, 'id' | 'extract_region_left' | 'extract_region_top' | 'extract_region_width' | 'extract_region_height'>;
export type ExtractOffsetUpdateDB = Pick<ImageRecordDB, 'id' | 'extract_region_left' | 'extract_region_top'>;

export interface ImageSelectDB extends Omit<ImageRecordDB, 'exif_jsonb'> {
    [key: `exif_${string}`]: string | number | null;
}

export const toInsert = (input: Image): ImageInsertDB => ({
    hash: input.hash,
    extract_region_left: input.extractRegion.left,
    extract_region_top: input.extractRegion.top,
    extract_region_width: input.extractRegion.width,
    extract_region_height: input.extractRegion.height,
    exif_jsonb: input.exif ? JSON.stringify(input.exif) : null,
    place_name: input.place?.name ?? null,
    place_type: input.place?.type ?? null,
    place_fullName: input.place?.fullName ?? null,
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
