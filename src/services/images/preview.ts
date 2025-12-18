
import fs from "fs/promises";
import { createReadStream } from "node:fs";

import { paths } from "../../config";
import { findExtractRegionRecordById } from "../../repositories/images";

export const getOptimizedImage = async (id: number) => {
    const extractRegionRecord = findExtractRegionRecordById(id);
    if (!extractRegionRecord) return null;

    const path = `${paths.optimized._base}/${extractRegionRecord.id}`;
    const stats = await fs.stat(path);
    return {
        stream: createReadStream(path),
        size: stats.size,
        mime: "image/avif",
    };
}
