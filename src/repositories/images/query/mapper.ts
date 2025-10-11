import type { Selection, ImageQuery } from '../../../models/images/query';
import type { ImageSelect } from '../../../models/images/repository';

export default (selection: Selection) => {
    const fields = [
        ...selection.id ? ['id'] : [],
        ...selection.hash ? ['hash'] : [],

        ...selection.extractRegion?.map(
            key => `extract_region_${key}`
        ) ?? [],

        ...selection.metadata ? [/* sql */`
            (
                SELECT json_group_object(json_each.key, json_each.value)
                FROM json_each(metadata_jsonb)
                WHERE json_each.key IN (${
                    selection.metadata.map(key => `'${key}'`).join(', ')
                })
            ) AS metadata_json
        `] : [],

        ...selection.place?.map(key =>
            key !== 'fullName' ? `place_${key}` : 'place_full_name'
        ) ?? [],
    ];

    const resolver = (record: ImageSelect): ImageQuery => ({
        ...selection.id && { id: record.id },
        ...selection.hash && { hash: record.hash },

        ...selection.extractRegion && {
            extractRegion: {
                left: record.extract_region_left,
                top: record.extract_region_top,
                width: record.extract_region_width,
                height: record.extract_region_height,
            },
        },

        ...selection.metadata && {
            metadata: JSON.parse(record.metadata_json),
        },

        ...selection.place && {
            place: record.place_name || record.place_type || record.place_full_name
                ? {
                    name: record.place_name || undefined,
                    type: record.place_type || undefined,
                    fullName: record.place_full_name || undefined,
                } : null,
        },
    });

    return { fields, resolver }
}
