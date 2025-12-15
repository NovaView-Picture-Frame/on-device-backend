import { z } from "zod";

import { orderSchema } from "../models/carousel";

export const argsSchema = z.tuple([
    z.literal("-c"),
    z.string().regex(/\.yaml$/),
]);

export const configSchema = z.object({
    device: z.object({
        screen: z.object({
            width: z.number().int().positive(),
            height: z.number().int().positive(),
        }),
    }),

    server: z.object({
        port: z.int().min(1024).max(65535),
        data_dir: z.string().nonempty(),
        database: z.string().nonempty(),
    }),

    runtime: z.object({
        tasks_results_ttl_ms: z.int().positive(),
        websocket_heartbeat_interval_ms: z.int().positive(),
        websocket_heartbeat_timeout_ms: z.int().positive(),
    }),

    services: z.object({
        upload: z.object({
            timeout_ms: z.int().positive(),
            size_limit_bytes: z.int().positive(),
        }),

        query: z.object({
            default_page_size: z.int().positive(),
            max_page_size: z.int().positive(),
        }),

        preview: z.object({
            max_width: z.int().positive(),
            max_height: z.int().positive(),
        }),

        carousel: z.object({
            default_order: orderSchema,
            default_interval_ms: z.int().positive(),
            acceptable_delay_ms: z.int().positive(),
            schedule_window_size: z.int().positive(),
        }),
    }),

    external: z.object({
        nominatim: z.object({
            user_agent: z.string().nonempty(),
        }),
    }),
}).strict();
