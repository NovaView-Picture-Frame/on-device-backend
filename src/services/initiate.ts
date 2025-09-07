import { randomUUID } from 'node:crypto';
import sharp from 'sharp';

export class InvalidBufferError extends Error {}

const asyncTask = (ms: number) => new Promise<string>(
    resolve => setTimeout(
        () => resolve(randomUUID())
        , ms
    )
);

export const processing = new Map<string, {
    step1: ReturnType<typeof asyncTask>,
    step2: ReturnType<typeof asyncTask>,
}>();

export const initiate = async (buf: Buffer) => {
    const image = sharp(buf);
    await image.metadata().catch(() => {
        throw new InvalidBufferError();
    });

    const step1= asyncTask(5000);
    const step2= asyncTask(10000);

    const id = randomUUID();
    processing.set(id, { step1, step2 });
    Promise.allSettled([step1, step2]).finally(() =>
        setTimeout(() => processing.delete(id), 10 * 60 * 1000)
    );

    return id;
};
