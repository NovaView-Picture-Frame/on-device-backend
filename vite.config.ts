import { defineConfig } from 'rolldown-vite'
import { viteStaticCopy } from 'vite-plugin-static-copy'

export default defineConfig({
    ssr: {
        noExternal: true,
    },
    build: {
        ssr: 'src/index.ts',
        target: 'esnext',
        minify: true,
    },
    plugins: [
        viteStaticCopy({
            targets: [
                {
                    src: 'node_modules/**/@img/sharp-*/lib/sharp-*.node',
                    dest: 'dependencies/@img',
                    rename: (_name, _ext, path) => {
                        const ver = path.match(/@img\/(sharp-[^/]+)/)?.[1];
                        if (!ver) throw new Error(`Bad sharp path: ${path}`);
                        return `${ver}/sharp.node`;
                    }
                },
                {
                    src: 'node_modules/**/@img/sharp-*/lib/libvips-cpp.*',
                    dest: 'dependencies/@img',
                    rename: (name, ext, path) => {
                        const ver = path.match(/@img\/(sharp-[^/]+)/)?.[1];
                        if (!ver) throw new Error(`Bad sharp path: ${path}`);
                        return `${ver}/lib/${name}.${ext}`;
                    }
                },
            ],
        }),
    ],
})
