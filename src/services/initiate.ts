import { randomUUID } from 'node:crypto';

export class InvalidBufferError extends Error {}

export const initiate = async (buf: Buffer) => {
    console.log(buf);
    const id = randomUUID();
    return id;
};
