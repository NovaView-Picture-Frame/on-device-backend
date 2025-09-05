import { defineConfig } from 'rolldown-vite'

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
})
