import type { z } from "zod";

import { carouselOrderSchema } from "../../config";

export type Order = z.infer<typeof carouselOrderSchema>;

export type OrderSwitchMode = "restart" | "continue";
