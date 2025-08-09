import fs from 'fs';
import { z } from 'zod';

export const parametersSchema = z.object({
    port: z.coerce.number().int().positive().max(65535),
    screen_width: z.coerce.number().int().positive(),
    screen_height: z.coerce.number().int().positive(),
    size_limit: z.coerce.number().int().positive(),
    work_directory: z.string().nonempty().refine(
        dir => {
            try {
                fs.mkdirSync(dir, { recursive: true });
                fs.accessSync(dir, fs.constants.R_OK | fs.constants.W_OK);
                return true;
            } catch {
                return false;
            }
        },
        { message: "Directory is not readable or writable." },
    ),
});

export type Parameters = z.infer<typeof parametersSchema>;
