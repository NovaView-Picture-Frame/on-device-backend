export type DropLastArg<T> =
    T extends (...args: infer A) => infer R
        ? A extends []
            ? []
            : T extends (...args: [...infer Rest, infer _Last]) => R
                ? Rest
                : never
        : never;
