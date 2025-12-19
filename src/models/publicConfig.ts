import { z } from "zod";

import { configSchema } from "../config";

export const publicConfigSchema = z.object({
    screenWidth: configSchema.shape.device.shape.screen.shape.width,
    screenHeight: configSchema.shape.device.shape.screen.shape.height,
    sizeLimitBytes: configSchema.shape.services.shape.upload.shape.size_limit_bytes,
});

export type PublicConfig = z.infer<typeof publicConfigSchema>;
