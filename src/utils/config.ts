import fs from 'node:fs/promises';
import { z } from 'zod';
import yaml from 'yaml';
import initDirs, { type DirTree } from './initDirs';

const configSchema = z.object({
    port: z.coerce.number().int().positive().max(65535),
    screen_width: z.coerce.number().int( ).positive(),
    screen_height: z.coerce.number().int().positive(),
    size_limit: z.coerce.number().int().positive(),
    work_dir: z.string().nonempty(),
});

const dirTree = {
    originals: { _withTmp: true },
    cropped: { _withTmp: true },
} satisfies DirTree;

const file = await fs.readFile('config.yaml', 'utf8');
const config = await configSchema.parseAsync(yaml.parse(file));
const paths = await initDirs(config.work_dir, dirTree);

export default { 
    port: config.port,
    screen_width: config.screen_width,
    screen_height: config.screen_height,
    size_limit: config.size_limit,
    paths,
};
