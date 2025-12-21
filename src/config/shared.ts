import { z } from "zod";

export const carouselOrderSchema =z.enum([
    "random",
    "createdAsc",
    "createdDesc",
    "takenAsc",
    "takenDesc",
]);
