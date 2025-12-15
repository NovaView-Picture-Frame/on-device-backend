import type { Sharp } from "sharp";

import { InvalidBufferError } from "./errors";
import { appConfig } from "../../../config";

class StreamAbortedError extends Error {}

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
        .resize(appConfig.device.screen.width, appConfig.device.screen.height, {
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
            appConfig.services.preview.max_width,
            appConfig.services.preview.max_height,
            { fit: "inside", withoutEnlargement: true },
        )
        .keepIccProfile()
        .avif()
        .toFile(input.path),
});
