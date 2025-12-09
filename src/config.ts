import fs from 'node:fs/promises';
import { z } from 'zod';
import yaml from 'yaml';

import { initDirs, type DirTree } from './utils/initDirs';

const argsSchema = z.tuple([
    z.literal('-c'),
    z.string().regex(/\.yaml$/),
]);

const configSchema = z.object({
    screen_width: z.int().positive(),
    screen_height: z.int().positive(),
    preview_max_width: z.int().positive(),
    preview_max_height: z.int().positive(),

    data_dir: z.string().nonempty(),
    database: z.string().nonempty(),
    size_limit_bytes: z.int().positive(),

    port: z.int().min(1024).max(65535),
    upload_timeout_ms: z.int().positive(),
    sse_keepalive_interval_ms: z.int().positive(),
    tasks_results_ttl_ms: z.int().positive(),
    nominatim_user_agent: z.string().nonempty(),

    carousel_default_interval_ms: z.int().positive(),
    carousel_window_size: z.int().positive(),
}).strict();

const dirTree = {
    originals: { _withTmp: true },
    cropped: { _withTmp: true },
    optimized: { _withTmp: true },
} satisfies DirTree;

const args = argsSchema.parse(process.argv.slice(2));
const file = await fs.readFile(args[1], 'utf-8');
const yamlConfig = configSchema.parse(yaml.parse(file));
const paths = await initDirs(yamlConfig.data_dir, dirTree);

export const config = {
    screenWidth: yamlConfig.screen_width,
    screenHeight: yamlConfig.screen_height,
    previewMaxWidth: yamlConfig.preview_max_width,
    previewMaxHeight: yamlConfig.preview_max_height,

    paths,
    database: yamlConfig.database,
    sizeLimitBytes: yamlConfig.size_limit_bytes,

    port: yamlConfig.port,
    uploadTimeoutMs: yamlConfig.upload_timeout_ms,
    sseKeepaliveIntervalMs: yamlConfig.sse_keepalive_interval_ms,
    tasksResultsTTLMs: yamlConfig.tasks_results_ttl_ms,
    nominatimUserAgent: yamlConfig.nominatim_user_agent,

    carouselDefaultIntervalMs: yamlConfig.carousel_default_interval_ms,
    carouselWindowSize: yamlConfig.carousel_window_size,
};
