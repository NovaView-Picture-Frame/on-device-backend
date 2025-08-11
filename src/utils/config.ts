import fs from 'node:fs/promises';
import { z } from 'zod';
import yaml from 'yaml';

const configSchema = z.object({
    port: z.coerce.number().int().positive().max(65535),
    screen_width: z.coerce.number().int().positive(),
    screen_height: z.coerce.number().int().positive(),
    size_limit: z.coerce.number().int().positive(),
    work_dir: z.string().nonempty(),
});

const initWorkdir = async (root: string) => {
    await fs.access(root, fs.constants.R_OK | fs.constants.W_OK);

    const originals = `${root}/originals`;
    const tmp = `${root}/tmp`;
    await Promise.all([
        fs.mkdir(originals, { recursive: true }),
        fs.rm(tmp, { recursive: true, force: true })
    ]);
    await fs.mkdir(tmp, { recursive: true });

    return { root, originals, tmp };
};

const file = await fs.readFile('config.yaml', 'utf8');
const { work_dir, ...rest } = await configSchema.parseAsync(yaml.parse(file));

export default {
    ...rest,
    paths: await initWorkdir(work_dir),
};
