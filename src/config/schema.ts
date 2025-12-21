import { z } from "zod";

import { carouselOrderSchema } from "./shared";

export const argsSchema = z.tuple([
    z.literal("-c"),
    z.string().regex(/\.yaml$/),
]);

export const configSchema = z.strictObject({
    device: z.strictObject({
        screen: z.strictObject({
            width: z.int().positive(),
            height: z.int().positive(),
        }),
    }),

    server: z.strictObject({
        port: z.int().min(1024).max(65535),
        data_dir: z.string().nonempty(),
        database: z.string().nonempty(),
    }),

    runtime: z.strictObject({
        websocket: z.strictObject({
            retries: z.int().nonnegative(),
            heartbeat: z.strictObject({
                interval_ms: z.int().positive(),
                timeout_ms: z.int().positive(),
            }),
        }),
    }),

    services: z.strictObject({
        upload: z.strictObject({
            timeout_ms: z.int().positive(),
            size_limit_bytes: z.int().positive(),
        }),

        query: z.strictObject({
            page_size: z.strictObject({
                default: z.int().positive(),
                max: z.int().positive(),
            }).refine(size => size.default <= size.max),
        }),

        preview: z.strictObject({
            max_width: z.int().positive(),
            max_height: z.int().positive(),
        }),

        carousel: z.strictObject({
            default_order: carouselOrderSchema,
            default_interval_ms: z.int().positive(),
            acceptable_delay_ms: z.int().positive(),
            schedule_window_size: z.strictObject({
                max_request: z.int().positive(),
                broadcast: z.int().positive(),
            }).refine(size => size.broadcast <= size.max_request),
        }),

        tasks_results_ttl_ms: z.int().positive(),
    }),

    external: z.strictObject({
        nominatim: z.strictObject({
            user_agent: z.string().nonempty(),
        }),
    }),
});
