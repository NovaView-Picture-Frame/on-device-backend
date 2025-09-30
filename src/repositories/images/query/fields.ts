import type { FieldsSelection } from '../../../models/images/query';
import type { ImageSelect } from '../../../models/images/repository';

export const buildFields = (select: FieldsSelection) => [
    ...new Set<string>([
        ...(select.id === 'include' ? ['id'] : []),
        ...(select.hash === 'include' ? ['hash'] : []),

        ...(select.extractRegion?.map(
            key => `extract_region_${key}`
        ) ?? []),

        ...(select.exif?.map(
            key => `json_extract(exif_jsonb, '$.${key}') AS exif_${key}`
        ) ?? []),

        ...(select.place?.map(
            key => `place_${key}`
        ) ?? []),
    ]),
];

export const toImageQuery = (
    record: ImageSelect,
    select: FieldsSelection
) => ({
    ...select.id === 'include' && { id: record.id },
    ...select.hash === 'include' && { hash: record.hash },

    ...Array.isArray(select.extractRegion) &&
    select.extractRegion.every(item => typeof item === 'string') && {
        extractRegion: Object.fromEntries(
            Object.entries(record)
                .filter(([key]) => key.startsWith('extract_region_'))
                .map(([k, v]) => [k.replace('extract_region_', ''), v])
        ),
    },

    ...Array.isArray(select.exif) &&
    select.exif.every(item => typeof item === 'string') && {
        exif: Object.fromEntries(
            Object.entries(record)
                .filter(([key]) => key.startsWith('exif_'))
                .map(([k, v]) => [k.replace('exif_', ''), v])
        ),
    },

    ...Array.isArray(select.place) &&
    select.place.every(item => typeof item === 'string') && {
        place: Object.fromEntries(
            Object.entries(record)
                .filter(([key]) => key.startsWith('place_'))
                .map(([k, v]) => [k.replace('place_', ''), v])
        ),
    },
});
