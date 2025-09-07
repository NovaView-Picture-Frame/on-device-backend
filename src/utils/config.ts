import fs from 'node:fs/promises';
import { z } from 'zod';
import yaml from 'yaml';

const argsSchema = z.tuple([
    z.literal('-c'),
    z.string().regex(/\.yaml$/),
])

const configSchema = z.object({
    port: z.number().int().min(1024).max(65535),
    screen_width: z.number().int().positive(),
    screen_height: z.number().int().positive(),
    size_limit: z.number().int().positive(),
    sse_keepalive_interval: z.number().int().positive(),
}).strict();

const args = argsSchema.parse(process.argv.slice(2));
const file = await fs.readFile(args[1], 'utf-8');
const yamlConfig = configSchema.parse(yaml.parse(file));

export default {
    port: yamlConfig.port,
    screenWidth: yamlConfig.screen_width,
    screenHeight: yamlConfig.screen_height,
    sseKeepaliveInterval: yamlConfig.sse_keepalive_interval,
    sizeLimit: yamlConfig.size_limit,
}
