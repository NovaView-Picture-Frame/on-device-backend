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
        sourcemap: process.env['npm_lifecycle_event'] === 'dev',
        rolldownOptions: {
            output: {
                legalComments: 'none',
            },
        },
    },
    plugins: [
        viteStaticCopy({
            targets: [
                {
                    src: 'node_modules/sharp/src/build/Release/sharp-*.node',
                    dest: 'node_modules/@img',
                    rename: (name, _ext, _path) => `${name}/sharp.node`,
                },
            ],
        }),
    ],
})
