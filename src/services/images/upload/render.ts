import type { Sharp } from "sharp";

import { StreamAbortedError, InvalidBufferError } from "./errors";
import { config } from "../../../config";

const abortableSharp = async <T>(input: {
    sharpInstance: Sharp;
    signal: AbortSignal;
    run: (sharp: Sharp) => Promise<T>;
}) => {
    input.signal.throwIfAborted();

    const { promise, resolve, reject } = Promise.withResolvers<T>();
    const onAbort = () => {
        reject(new StreamAbortedError());
        input.sharpInstance.destroy();
    };

    input.signal.addEventListener("abort", onAbort, { once: true });
    input.run(input.sharpInstance).then(resolve, reject);

    return await promise
        .catch(err => {
            if (err instanceof StreamAbortedError) throw err;
            throw new InvalidBufferError();
        })
        .finally(() => input.signal.removeEventListener("abort", onAbort));
};

export const getMetadata = async (sharpInstance: Sharp, signal: AbortSignal) =>
    abortableSharp({ sharpInstance, signal, run: sharp => sharp.metadata() });

export const resizeToCover = async (input: {
    sharpInstance: Sharp;
    path: string;
    signal: AbortSignal;
}) => abortableSharp({
    sharpInstance: input.sharpInstance,
    signal: input.signal,
    run: sharp => sharp
        .resize(config.device.screen.width, config.device.screen.height, {
            fit: "cover",
            position: "entropy",
        })
        .keepIccProfile()
        .png()
        .toFile(input.path),
});

export const resizeToInside = async (input: {
    sharpInstance: Sharp;
    path: string;
    signal: AbortSignal;
}) => abortableSharp({
    sharpInstance: input.sharpInstance,
    signal: input.signal,
    run: sharp => sharp
        .resize(
            config.services.preview.max_width,
            config.services.preview.max_height,
            { fit: "inside", withoutEnlargement: true },
        )
        .keepIccProfile()
        .avif()
        .toFile(input.path),
});
