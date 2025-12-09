import { randomBytes, createHash } from 'crypto';

import { config } from '../../../config';
import type { Slot } from '../../../models/carousel';

const seed = randomBytes(32);

const getRound = (IDs: number[], index: number) => {
    const getKey = (id: typeof IDs[number]) =>
        createHash('sha256')
            .update(seed)
            .update(':')
            .update(String(index))
            .update(':')
            .update(String(id))
            .digest();

    return IDs
        .map(id => ({
            id,
            key: getKey(id),
        }))
        .sort((a, b) => a.key.compare(b.key))
        .map(entry => entry.id);
}

const buildSlot = (input: {
    index: number;
    startTime: Date;
    id: number;
}): Slot => ({
    id: `slot-${input.index}`,
    startTime: new Date(
        input.startTime.getTime() + input.index * config.carouselDefaultIntervalMs
    ),
    payload: {
        id: input.id,
    },
})

export const getSlots = (input: {
    IDs: number[];
    startTime: Date;
    start: number;
    length: number;
    random?: boolean;
}) => {
    if (input.start < 0 || input.length < 0) throw new Error(
        `Invalid arguments: 'start' and 'length' must be non-negative.`
    );

    const { length } = input.IDs;
    if (length === 0) return [];

    if (input?.random) {
        const startRound = ~~(input.start / length);
        const startIndex = input.start % length;
        const endIndex = startIndex + input.length;
        const roundCount = Math.ceil(endIndex / length);

        const rounds = Array.from({ length: roundCount }, (_, offset) =>
            getRound(
                input.IDs,
                startRound + offset,
            )
        );

        return rounds
            .flat()
            .slice(startIndex, endIndex)
            .map((id, offset) => buildSlot({
                index: input.start + offset,
                startTime: input.startTime,
                id,
            }));
    } else {
        return Array.from({ length: input.length }, (_, offset) => {
            const index = input.start + offset;
            const id = input.IDs[index % length];
            if (id === undefined) throw new Error(
                `Unexpected error: No ID found at index ${index}.`
            );

            return buildSlot({
                index,
                startTime: input.startTime,
                id,
            });
        });
    }
}
