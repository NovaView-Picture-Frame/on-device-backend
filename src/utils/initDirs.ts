import fs from 'node:fs/promises';

export type DirTree = { _withTmp?: boolean; _base?: never; _tmp?: never } & (
    { [k: string]: DirTree } | {}
);

function* walkTree(tree: DirTree, path = ''): Generator<[string, DirTree]> {
    yield [path, tree];
    for (const [k, v] of Object.entries(tree))
        if (v && typeof v === 'object')
            yield* walkTree(v, path ? `${path}/${k}` : k);
}

type NodePaths = {
    _base?: string;
    _tmp?: string;
    [key: string]: NodePaths | string;
};

const getNodeAtPath = (root: NodePaths, path: string) => path
    ? path.split('/').reduce((cur, k) => {
        const next = cur[k];
        return typeof next === 'object' && next !== null
            ? next
            : (cur[k] = {});
    }, root)
    : root;

type BasePaths<T> = { readonly _base: string } & (
    T extends { _withTmp: true } ? { readonly _tmp: string } : {}
);

type Node<T> = BasePaths<T> & {
    readonly [K in keyof Omit<T, '_withTmp' | '_base' | '_tmp'>]:
    T[K] extends object ? Node<T[K]> : never;
};

function assertPaths<T extends DirTree>(paths: NodePaths, tree: T):
    asserts paths is Readonly<Node<T>> {
        for (const [path, node] of walkTree(tree)) {
            const cur = getNodeAtPath(paths, path);

            if (path && typeof cur._base !== 'string') throw new Error(
                `"${path}"._base must be a string`
            );
            if (node._withTmp && typeof cur._tmp !== 'string') throw new Error(
                `"${path}"._tmp must be a string (_withTmp: true)`
            );
        }
    }

export const initDirs = async <const T extends DirTree>(root: string, tree: T) => {
    const tmpRoot = `${root}/.tmp`;
    await fs.rm(tmpRoot, { recursive: true, force: true });

    const paths: NodePaths = {};
    const promises: ReturnType<typeof fs.mkdir>[] = [];
    for (const [path, node] of walkTree(tree)) {
        const cur = getNodeAtPath(paths, path);
        const relPath = path ? `/${path}` : '';

        promises.push(fs.mkdir(
            cur._base = root + relPath, { recursive: true }
        ));
        node._withTmp && promises.push(fs.mkdir(
            cur._tmp = tmpRoot + relPath, { recursive: true }
        ));
    }

    await Promise.all(promises);
    assertPaths(paths, tree);
    return paths;
}
