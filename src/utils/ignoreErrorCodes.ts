const suppressError = <T>(promise: Promise<T>, codes: string | string[]) =>
    promise.catch(err => {
        const list = Array.isArray(codes) ? codes : [codes];

        if (
            err instanceof Error &&
            "code" in err &&
            typeof err.code === "string" &&
            list.includes(err.code)
        ) return;

        throw err;
    });

export function ignoreErrorCodes<T>(promises: Promise<T>[], code: string): Promise<T | void>[];
export function ignoreErrorCodes<T>(promise: Promise<T>, code: string): Promise<T | void>;
export function ignoreErrorCodes<T>(input: Promise<T> | Promise<T>[], code: string) {
    return Array.isArray(input)
        ? input.map(p => suppressError(p, code))
        : suppressError(input, code);
}
