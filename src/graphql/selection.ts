import { getDeepResolvingFields, type ResolverPayload } from "@gqloom/core";

import type { Selection } from "../models/images";

export const parseSelection = (payload: ResolverPayload): Selection => {
    const resolvedFields = getDeepResolvingFields(payload);

    const rootField = resolvedFields.get("")?.requestedFields;
    if (!rootField) throw new Error("Root field not found in selection.");

    return Object.fromEntries(
        Array.from(rootField, field => {
            const nestedField = resolvedFields.get(field)?.requestedFields;

            return [
                field,
                nestedField
                    ? Array.from(nestedField)
                    : "include",
            ]
        })
    );
};
