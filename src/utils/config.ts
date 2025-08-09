import path from 'node:path';
import fs from 'node:fs';
import { parseArgs } from 'node:util';
import { z } from 'zod';

const configSchema = z.object({
    port: z.coerce.number().int().positive().max(65535),
    screen_width: z.coerce.number().int().positive(),
    screen_height: z.coerce.number().int().positive(),
    size_limit: z.coerce.number().int().positive(),
    work_directory: z.string().nonempty()
        .transform(dir => path.resolve(dir)).refine(
            dir => {
                try {
                    fs.mkdirSync(dir, { recursive: true });
                    fs.accessSync(dir, fs.constants.R_OK | fs.constants.W_OK);
                    return true;
                } catch {
                    return false;
                }
            },
            { message: "Directory is not readable or writable." }
        ),
});

const { values } = parseArgs({
    options: {
        port: { type: 'string' },
        screen_width: { type: 'string' },
        screen_height: { type: 'string' },
        size_limit: { type: 'string' },
        work_directory: { type: 'string' },
    },
});

export default configSchema.parse(values);
