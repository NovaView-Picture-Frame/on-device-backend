const suppressError = <T>(promise: Promise<T>, codes: string | string[]) => promise
    .catch(err => {
        const list = Array.isArray(codes) ? codes : [codes];

        if (
            err instanceof Error &&
            'code' in err &&
            typeof err.code === 'string' &&
            list.includes(err.code)
        ) return;

        throw err;
    })

export default function <T>(promises: Promise<T>[], code: string | string[]): Promise<T | void>[];
export default function <T>(promise: Promise<T>, code: string | string[]): Promise<T | void>;
export default function <T>(input: Promise<T> | Promise<T>[], code: string | string[]) {
    return Array.isArray(input)
        ? input.map(p => suppressError(p, code))
        : suppressError(input, code);
}
