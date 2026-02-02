import { createServer } from "vite";

const vite = await createServer({
    configFile: false,
    server: {
        middlewareMode: true,
        hmr: false,
        watch: null,
    },
});

await vite.ssrLoadModule("src");
