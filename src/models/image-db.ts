import type { Image, ExtractRegionRecord } from './image';

interface ExifDB {
    exif_make: string | null;
    exif_model: string | null;
    exif_lensMake: string | null;
    exif_lensModel: string | null;
    exif_software: string | null;

    exif_dateTimeOriginal: string | null;
    exif_offsetTimeOriginal: string | null;

    exif_exposureTime: number | null;
    exif_exposureProgram: number | null;
    exif_isoSpeedRatings: number | null;
    exif_fNumber: number | null;
    exif_apertureValue: number | null;
    exif_shutterSpeedValue: number | null;
    exif_focalLength: number | null;
    exif_focalLengthIn35mmFilm: number | null;
    exif_flash: number | null;

    exif_pixelXDimension: number | null;
    exif_pixelYDimension: number | null;
    exif_orientation: number | null;
    exif_colorSpace: number | null;

    exif_gpsLatitude: number | null;
    exif_gpsLongitude: number | null;
    exif_gpsAltitude: number | null;
    exif_gpsImgDirection: number | null;
}

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

export const toInsert = (input: Image): ImageInsertDB => ({
    hash: input.hash,
    extract_region_left: input.extractRegion.left,
    extract_region_top: input.extractRegion.top,
    extract_region_width: input.extractRegion.width,
    extract_region_height: input.extractRegion.height,
    exif_jsonb: input.exif
        ? JSON.stringify(input.exif, (_, value) =>
            value === null ? undefined : value
        )
        : null,
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
