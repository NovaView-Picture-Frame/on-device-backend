import { defineConfig } from "vite";
import { viteStaticCopy } from "vite-plugin-static-copy";

export default defineConfig({
    ssr: {
        noExternal: true,
    },
    build: {
        ssr: "src/index.ts",
        target: "esnext",
        minify: true,
        sourcemap: true,
        rolldownOptions: {
            output: {
                legalComments: "none",
            },
        },
    },
    plugins: [
        viteStaticCopy({
            environment: "ssr",
            targets: [
                {
                    src: "node_modules/sharp/src/build/Release/sharp-*.node",
                    dest: "node_modules/@img",
                    rename: name => `${name}/sharp.node`,
                },
                {
                    src: "node_modules/better-sqlite3/build/Release/better_sqlite3.node",
                    dest: "node_modules/better-sqlite3",
                },
            ],
        }),
    ],
});
