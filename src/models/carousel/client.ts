import { z } from "zod";

import { config, carouselOrderSchema } from "../../config";

export const carouselClientMessageSchema = z.discriminatedUnion("type", [
    z.strictObject({
        type: z.literal("requestSchedule"),
        windowSize: z.number().int().positive().max(
            config.services.carousel.schedule_window_size.max_request,
        ),
    }),
    z.strictObject({
        type: z.literal("preloadComplete"),
        id: z.string().nonempty(),
        timeStamp: z.coerce.date(),
    }),
    z.strictObject({
        type: z.literal("switchOrder"),
        newOrder: carouselOrderSchema,
    }),
]);

export type CarouselClientMessage = z.infer<typeof carouselClientMessageSchema>;
