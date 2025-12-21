
import fs from "fs/promises";
import { createReadStream } from "node:fs";

import { paths } from "../../config";
import { findExtractRegionRecordById } from "../../repositories/images";
import { FileSystemError } from "./errors";

export const getOptimizedImage = async (id: number) => {
    const extractRegionRecord = findExtractRegionRecordById(id);
    if (!extractRegionRecord) return null;

    const path = `${paths.optimized._base}/${extractRegionRecord.id}`;
    const stats = await fs.stat(path).catch(() => {
        throw new FileSystemError("Optimized image file not found");
    });
    return {
        stream: createReadStream(path),
        size: stats.size,
        mime: "image/avif",
    };
}
