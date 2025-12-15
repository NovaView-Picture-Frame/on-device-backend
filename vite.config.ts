import { spawn } from "child_process";
import { defineConfig } from "rolldown-vite";
import { viteStaticCopy } from "vite-plugin-static-copy";

const restartAfterBuild = (command: string) => ({
    name: "vite-plugin-restart-after-build",
    writeBundle: () => spawn(
        "sh",
        ["-c", `pkill -f "${command}"; ${command}`],
        { stdio: "inherit" }
    ),
});

const isDev = process.env["npm_lifecycle_event"] === "dev";

export default defineConfig({
    ssr: {
        noExternal: true,
    },
    build: {
        ssr: "src/index.ts",
        target: "esnext",
        minify: true,
        sourcemap: isDev,
        rolldownOptions: {
            output: {
                legalComments: "none",
            },
        },
    },
    plugins: [
        isDev && restartAfterBuild("$npm_execpath run start"),
        viteStaticCopy({
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
