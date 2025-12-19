import { z } from "zod";

import { orderSchema } from "../models/carousel";

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
        tasks_results_ttl_ms: z.int().positive(),
        websocket_heartbeat_interval_ms: z.int().positive(),
        websocket_heartbeat_timeout_ms: z.int().positive(),
        websocket_heartbeat_retries: z.int().nonnegative(),
    }),

    services: z.strictObject({
        upload: z.strictObject({
            timeout_ms: z.int().positive(),
            size_limit_bytes: z.int().positive(),
        }),

        query: z.strictObject({
            default_page_size: z.int().positive(),
            max_page_size: z.int().positive(),
        }),

        preview: z.strictObject({
            max_width: z.int().positive(),
            max_height: z.int().positive(),
        }),

        carousel: z.strictObject({
            default_order: orderSchema,
            default_interval_ms: z.int().positive(),
            acceptable_delay_ms: z.int().positive(),
            schedule_window_size: z.int().positive(),
        }),
    }),

    external: z.strictObject({
        nominatim: z.strictObject({
            user_agent: z.string().nonempty(),
        }),
    }),
});
