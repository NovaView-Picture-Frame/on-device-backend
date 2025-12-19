import type { ImageRecord } from "./base";
import type { ZodPartial } from "../../utils/zod";

type Field<T> = T extends object ? (keyof T)[] : "include";

type ImageRecordFieldMap = {
    [K in keyof ImageRecord]: Field<NonNullable<ImageRecord[K]>>;
};

export type Selection = ZodPartial<ImageRecordFieldMap>;
