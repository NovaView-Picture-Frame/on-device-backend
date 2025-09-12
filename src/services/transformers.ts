import { Transform } from 'node:stream';
import { createHash } from 'node:crypto';

export class MaxSizeError extends Error {}

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
};

export const createHashTransformer = (algorithm: Parameters<typeof createHash>[0]) => {
    const processor = createHash(algorithm);
    const { promise: hash, resolve, reject } = Promise.withResolvers<Buffer>();

    const transform = new Transform({
        transform(chunk, _, callback) {
            processor.update(chunk);
            callback(null, chunk);
        },
        flush(callback) {
            resolve(processor.digest());
            callback();
        },
    });

    transform.on('error', err => reject(err));
    return { transform, hash };
};
