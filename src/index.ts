import { fastify } from "fastify";
import { exiftool } from "exiftool-vendored";

import { errorHandler } from "./middleware/errorHandler";
import { httpRoutes, binaryRoutes, sseRoutes } from "./http/routes";
import { wsRoutes } from "./ws/routes";
import { config } from "./config";

const app = fastify();

app.setErrorHandler(errorHandler);
app.register(httpRoutes);
app.register(binaryRoutes);
app.register(sseRoutes);
app.register(wsRoutes);

let closing = false;
const cleanUp = async (exitCode: 0 | 1) => {
    if (closing) return;
    closing = true;

    await app.close().catch(err => console.error("Error closing server: ", err));
    await exiftool.end().catch(err => console.error("Error closing exiftool: ", err));

    process.exit(exitCode);
};

const shutdown = (signal: NodeJS.Signals) => {
    console.log(`Received ${signal}, shutting down...`);
    return cleanUp(0);
};

process.once("SIGTERM", () => shutdown("SIGTERM"));
process.once("SIGINT", () => shutdown("SIGINT"));

try {
    const versionForWarmup = await exiftool.version();
    console.log(`EXIFTool version ${versionForWarmup} ready for requests`);
    const address = await app.listen({ port: config.server.port });
    console.log(`Server listening at ${address}`);
} catch (err) {
    console.error("Error starting server: ", err);
    await cleanUp(1);
}
