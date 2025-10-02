import type { FieldsSelection } from '../../../models/images/query';
import type { ImageSelect } from '../../../models/images/repository';

export default (select: FieldsSelection) => {
    const fields = [
        ...select.id ? ['id'] : [],
        ...select.hash ? ['hash'] : [],

        ...select.extractRegion?.map(
            key => `extract_region_${key}`
        ) ?? [],

        ...select.metadata ? [/* sql */`
            (
                SELECT json_group_object(json_each.key, json_each.value)
                FROM json_each(metadata_jsonb)
                WHERE json_each.key IN (${select.metadata.map(key => `'${key}'`).join(', ')})
            ) AS metadata_json
        `] : [],

        ...select.place?.map(
            key => `place_${key}`
        ) ?? [],
    ];

    const resolver = (record: ImageSelect) => ({
        ...select.id === 'include' && { id: record.id },
        ...select.hash === 'include' && { hash: record.hash },

        ...select.extractRegion && {
            extractRegion: Object.fromEntries(
                Object.entries(record)
                    .filter(([key]) => key.startsWith('extract_region_'))
                    .map(([k, v]) => [k.replace('extract_region_', ''), v])
            ),
        },

        ...select.metadata && {
            metadata: JSON.parse(record.metadata_json),
        },

        ...select.place && {
            place: Object.fromEntries(
                Object.entries(record)
                    .filter(([key]) => key.startsWith('place_'))
                    .map(([k, v]) => [k.replace('place_', ''), v])
            ),
        },
    });

    return { fields, resolver };
};
