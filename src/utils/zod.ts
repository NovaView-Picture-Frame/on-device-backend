import { z } from "zod";
import type { UUID } from "node:crypto";

export const uuidSchema = z.uuidv4().pipe(z.custom<UUID>())

export type ZodPartial<T> = Partial<{
    [P in keyof T]: T[P] | undefined;
}>;
