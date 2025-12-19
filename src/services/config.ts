import { config } from "../config"
import type { PublicConfig } from "../models/publicConfig";

export const publicConfig: PublicConfig = {
    screenHeight: config.device.screen.height,
    screenWidth: config.device.screen.width,
    sizeLimitBytes: config.services.upload.size_limit_bytes,
};
