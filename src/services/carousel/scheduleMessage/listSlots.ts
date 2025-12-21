import { createHash } from "node:crypto";

import { config } from "../../../config";
import type { SlotImage, Slot } from "../../../models/carousel";

interface BaseInput {
    images: SlotImage[];
    startTime: Date;
    start: number;
    length: number;
}

type RandomOption =
    | { random: true; seed: Buffer; }
    | { random: false; seed?: never; };

type GetSlotsInput = BaseInput & RandomOption;

const getRound = (input: {
    images: SlotImage[];
    index: number;
    seed: Buffer;
}) => {
    const getKey = (image: SlotImage) =>
        createHash("sha256")
            .update(input.seed)
            .update(":")
            .update(String(input.index))
            .update(":")
            .update(String(image.id))
            .digest();

    return input.images
        .map(image => ({
            image,
            key: getKey(image),
        }))
        .sort((a, b) => a.key.compare(b.key))
        .map(entry => entry.image);
};

const buildSlot = (input: {
    index: number;
    startTime: Date;
    image: SlotImage;
}): Slot => ({
    id: `slot-${input.index}`,
    startTime: new Date(
        input.startTime.getTime() + input.index * config.services.carousel.default_interval_ms,
    ),
    image: input.image,
});

export const listSlots = (input: GetSlotsInput) => {
    const { images, startTime, start, length, random, seed } = input;

    if (start < 0 || length < 0)
        throw new Error(`Invalid arguments: "start" and "length" must be non-negative.`);

    const imagesLength = images.length;
    if (imagesLength === 0) return [];

    if (random) {
        const startRound = ~~(start / imagesLength);
        const startIndex = start % imagesLength;
        const endIndex = startIndex + length;
        const roundCount = Math.ceil(endIndex / imagesLength);

        const rounds = Array.from({ length: roundCount }, (_, offset) =>
            getRound({
                images,
                index: startRound + offset,
                seed,
            }),
        );

        return rounds
            .flat()
            .slice(startIndex, endIndex)
            .map((image, offset) => buildSlot({
                index: start + offset,
                startTime,
                image,
            }));
    } else {
        return Array.from({ length }, (_, offset) => {
            const index = start + offset;
            const image = images[index % imagesLength];
            if (image === undefined)
                throw new Error(`Unexpected error: No image found at index ${index}.`);

            return buildSlot({
                index,
                startTime,
                image,
            });
        });
    }
};
