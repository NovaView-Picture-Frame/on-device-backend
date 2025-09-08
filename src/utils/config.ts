import fs from 'node:fs/promises';
import { z } from 'zod';
import yaml from 'yaml';

import initDirs, { type DirTree } from './initDirs';

const argsSchema = z.tuple([
    z.literal('-c'),
    z.string().regex(/\.yaml$/),
])

const configSchema = z.object({
    screen_width: z.number().int().positive(),
    screen_height: z.number().int().positive(),
    preview_max_width: z.number().int().positive(),
    preview_max_height: z.number().int().positive(),

    data_dir: z.string().nonempty(),
    database: z.string().nonempty(),
    size_limit: z.number().int().positive(),

    port: z.number().int().min(1024).max(65535),
    upload_timeout: z.number().int().positive(),
    sse_keepalive_interval: z.number().int().positive(),
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

export default {
    screenWidth: yamlConfig.screen_width,
    screenHeight: yamlConfig.screen_height,
    previewMaxWidth: yamlConfig.preview_max_width,
    previewMaxHeight: yamlConfig.preview_max_height,

    paths,
    database: yamlConfig.database,
    sizeLimit: yamlConfig.size_limit,

    port: yamlConfig.port,
    uploadTimeout: yamlConfig.upload_timeout,
    sseKeepaliveInterval: yamlConfig.sse_keepalive_interval,

};
