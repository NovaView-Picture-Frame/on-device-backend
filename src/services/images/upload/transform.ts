import { Transform } from 'node:stream';

export class MaxSizeError extends Error {};

export const createMaxSizeTransform = (limit: number) => {
    let total = 0;

    return new Transform({
        transform(chunk, _, callback) {
            total += chunk.length;
            total > limit
                ? callback(new MaxSizeError())
                : callback(null, chunk);
        },
    });
}
