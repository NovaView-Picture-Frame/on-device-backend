import type { Selection } from '../../../models/images';

export const buildSelector = (selection: Selection) => {
    const fields = [
        ...(selection.id ? [`'id', id`] : []),
        ...(selection.hash ? [`'hash', hash`] : []),

        ...(selection.extractRegion
            ? [`'extractRegion', json_object(${
                selection.extractRegion.reduce((acc, key, index) => {
                    const entry = `'${key}', extract_region_${key}`;
                    return acc + (index ? ', ' : '') + entry;
                }, '')
            })`] : []
        ),

        ...(selection.metadata
            ? [`'metadata', (
                SELECT json_group_object(json_each.key, json_each.value)
                FROM json_each(metadata_jsonb)
                WHERE json_each.key IN (${
                    selection.metadata.reduce((acc, key, index) => {
                        const entry = `'${key}'`;
                        return acc + (index ? ', ' : '') + entry;
                    }, '')
                })
            )`] : []
        ),

        ...(selection.place
            ? [`'place', CASE WHEN NOT _place_exists THEN NULL ELSE json_object(${
                selection.place.reduce((acc, key, index) => {
                    const entry = `'${key}', place_${key === 'fullName' ? 'full_name' : key}`;
                    return acc + (index ? ', ' : '') + entry;
                }, '')
            }) END`] : []
        ),
    ];

    return `json_object(${fields.join(', ')})`;
}
