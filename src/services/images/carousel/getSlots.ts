import { createHash } from 'crypto';

import { appConfig } from '../../../config';
import type { Slot } from '../../../models/carousel';

interface BaseInput {
    ids: number[];
    startTime: Date;
    start: number;
    length: number;
}

type RandomOption =
    | { random: true; seed: Buffer; }
    | { random: false; seed?: never; };

type GetSlotsInput = BaseInput & RandomOption;

const getRound = (input: {
    ids: number[];
    index: number;
    seed: Buffer;
}) => {
    const getKey = (id: typeof input.ids[number]) =>
        createHash('sha256')
            .update(input.seed)
            .update(':')
            .update(String(input.index))
            .update(':')
            .update(String(id))
            .digest();

    return input.ids
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
        input.startTime.getTime() + input.index * appConfig.services.carousel.default_interval_ms
    ),
    payload: { id: input.id },
})

export const getSlots = (input: GetSlotsInput) => {
    const { ids, startTime, start, length, random, seed } = input;

    if (start < 0 || length < 0) throw new Error(
        "Invalid arguments: 'start' and 'length' must be non-negative."
    );

    const idsLength = ids.length;
    if (idsLength === 0) return [];

    if (random) {
        const startRound = ~~(start / idsLength);
        const startIndex = start % idsLength;
        const endIndex = startIndex + length;
        const roundCount = Math.ceil(endIndex / idsLength);

        const rounds = Array.from({ length: roundCount }, (_, offset) =>
            getRound({
                ids,
                index: startRound + offset,
                seed,
            })
        );

        return rounds
            .flat()
            .slice(startIndex, endIndex)
            .map((id, offset) => buildSlot({
                index: start + offset,
                startTime,
                id,
            }));
    } else {
        return Array.from({ length }, (_, offset) => {
            const index = start + offset;
            const id = ids[index % idsLength];
            if (id === undefined) throw new Error(
                `Unexpected error: No ID found at index ${index}.`
            );

            return buildSlot({
                index,
                startTime,
                id,
            });
        });
    }
}
