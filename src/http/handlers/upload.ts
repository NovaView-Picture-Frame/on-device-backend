import { randomUUID } from "node:crypto";
import { PassThrough } from "node:stream";
import { pipeline } from "node:stream/promises";
import { z } from "zod";
import type { FastifyRequest, FastifyReply } from "fastify";

import { config } from "../../config";
import { HttpBadRequestError } from "../../middleware/errorHandler";
import {
    findExtractRegionRecordByHash,
    createMaxSizeTransform,
    uploadImage,
    InvalidBufferError,
    MaxSizeError,
} from "../../services/images";
import type { ExtractRegionRecord } from "../../models/images";

const headerSchema = z.object({
    "content-type": z.string().regex(/^image\/[^;]+/i).optional(),
    "content-length": z.coerce.number().int().positive().max(
        config.services.upload.size_limit_bytes
    ).optional(),
    "content-hash": z.string().length(64).regex(/^\p{Hex_Digit}+$/v).optional(),
    "file-name": z.string().max(255).optional(),
});

const respondExisting = (reply: FastifyReply, record: ExtractRegionRecord) =>
    reply.send({
        data: {
            type: "existing",
            record,
        },
    });

export const uploadHandler = async (request: FastifyRequest, reply: FastifyReply) => {
    const headerResult = headerSchema.safeParse(request.headers);
    if (!headerResult.success) throw new HttpBadRequestError("Invalid headers");

    const headerHash = headerResult.data["content-hash"];
    if (headerHash) {
        const extractRegionRecord = findExtractRegionRecordByHash(headerHash);

        if (extractRegionRecord) {
            respondExisting(reply, extractRegionRecord);
            return;
        }
    }

    const timeoutController = new AbortController();
    const existingController = new AbortController();
    const taskController = new AbortController();
    const signal = AbortSignal.any([
        timeoutController.signal,
        existingController.signal,
        taskController.signal,
    ]);

    const taskId = randomUUID();
    const tee = new PassThrough();
    const hashAndMetadata = uploadImage({
        taskId: taskId,
        stream: tee,
        signal,
    });
    const timer = setTimeout(() => timeoutController.abort(), config.services.upload.timeout_ms);

    hashAndMetadata.then(
        ({ hash }) => {
            const extractRegionRecord = findExtractRegionRecordByHash(hash);
            if (!extractRegionRecord) return;

            existingController.abort();
            respondExisting(reply, extractRegionRecord);
        },
        () => {},
    );

    try {
        await Promise.all([
            pipeline(
                request.raw,
                createMaxSizeTransform(config.services.upload.size_limit_bytes),
                tee,
                { signal },
            ),
            hashAndMetadata,
        ]);

        if (existingController.signal.aborted) return;

        reply.send({
            data: {
                type: "processing",
                taskId,
            },
        });
    } catch (err) {
        if (timeoutController.signal.aborted) throw new HttpBadRequestError("Request timeout");

        taskController.abort();

        if (err instanceof MaxSizeError)
            throw new HttpBadRequestError(
                `Max ${config.services.upload.size_limit_bytes} bytes`,
            );

        if (err instanceof InvalidBufferError)
            throw new HttpBadRequestError("Invalid image buffer");

        throw err;
    } finally {
        clearTimeout(timer);
    }
};
