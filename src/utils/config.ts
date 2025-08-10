import path from 'node:path';
import fs from 'node:fs/promises';
import { parseArgs } from 'node:util';
import { z } from 'zod';

const configSchema = z.object({
    port: z.coerce.number().int().positive().max(65535),
    screen_width: z.coerce.number().int().positive(),
    screen_height: z.coerce.number().int().positive(),
    size_limit: z.coerce.number().int().positive(),
    work_directory: z.string().nonempty()
        .transform(dir => path.resolve(dir)).refine(
            async dir => {
                try {
                    await Promise.all([
                        fs.mkdir(`${dir}/originals`, { recursive: true }),
                        fs.rm(`${dir}/tmp`, { recursive: true, force: true })
                    ]);
                    await fs.mkdir(`${dir}/tmp`, { recursive: true })
                    return true;
                } catch {
                    return false;
                }
            },
            { message: "Failed to initialize the working directory" }
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

export default await configSchema.parseAsync(values);
