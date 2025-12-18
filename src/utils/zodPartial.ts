export type ZodPartial<T> = Partial<{
    [P in keyof T]: T[P] | undefined;
}>;
