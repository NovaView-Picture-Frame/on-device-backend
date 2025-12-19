import { Transform } from "node:stream";

import { MaxSizeError } from "./errors";

export const createMaxSizeTransform = (limit: number) => {
    let total = 0;

    return new Transform({
        transform(chunk, _, callback) {
            total += chunk.length;
            if (total > limit) {
                callback(new MaxSizeError());
            } else {
                callback(null, chunk);
            }
        },
    });
};
