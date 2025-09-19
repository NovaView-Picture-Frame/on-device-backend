import { z } from "zod";

import { placeSchema } from "../services/upload/persist";

export interface ExtractOffset {
    left: number;
    top: number;
}

export interface ExtractRegion extends ExtractOffset {
    width: number;
    height: number;
}

export interface Exif {
    make: string | null;
    model: string | null;
    lensMake: string | null;
    lensModel: string | null;
    software: string | null;

    dateTimeOriginal: string | null;
    offsetTimeOriginal: string | null;

    exposureTime: number | null;
    exposureProgram: number | null;
    isoSpeedRatings: number | null;
    fNumber: number | null;
    apertureValue: number | null;
    shutterSpeedValue: number | null;
    focalLength: number | null;
    focalLengthIn35mmFilm: number | null;
    flash: number | null;

    pixelXDimension: number | null;
    pixelYDimension: number | null;
    orientation: number | null;
    colorSpace: number | null;

    gpsLatitude: number | null;
    gpsLongitude: number | null;
    gpsAltitude: number | null;
    gpsImgDirection: number | null;
};

export type Place = z.infer<typeof placeSchema>;

export interface Image {
    id: number;
    hash: Buffer;
    extractRegion: ExtractRegion;
    exif: Exif | null;
    place: Place | null;
}

export type ExtractRegionRecord = Pick<Image, 'id' | 'extractRegion'>;

export type ExtractOffsetUpdate = Pick<Image, 'id'> & Pick<Image['extractRegion'], 'left' | 'top'>;
