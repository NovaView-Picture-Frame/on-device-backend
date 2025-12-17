import { getDeepResolvingFields, type ResolverPayload } from "@gqloom/core";

import type { Selection } from "./models/images";

export const parseSelection = (payload: ResolverPayload): Selection => {
    const rootMap = getDeepResolvingFields(payload);

    const rootSet = rootMap.get("")?.requestedFields;
    if (!rootSet) throw new Error("Unexpected error: rootSet does not exist.");

    return Object.fromEntries(
        Array.from(rootSet, field => {
            const childSet = rootMap.get(field)?.requestedFields;
            return [
                field,
                childSet
                    ? Array.from(childSet)
                    : "include",
            ]
        })
    );
};
