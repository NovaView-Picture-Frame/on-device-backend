import koa from 'koa';
import { WebSocketServer } from 'ws';
import { exiftool } from 'exiftool-vendored';

import { errorHandler } from './middleware/errorHandler';
import { buildHttpRouters } from './http/router';
import { appConfig } from './config';
import { carouselHandler } from './ws/handlers/carousel';

const app = new koa();
app.use(errorHandler);

const { router, bodyRouter } = buildHttpRouters();
app.use(router.routes());
app.use(bodyRouter.routes());

const httpServer = app.listen(appConfig.server.port, () =>
    console.log(`Server listening on port ${appConfig.server.port}`)
);

const wsServer = new WebSocketServer({
    server: httpServer,
    path: '/carousel',
});

wsServer.addListener('connection', carouselHandler);

const shutdown = async (signal: string) => {
    console.log(`Received ${signal}, shutting down...`);
    try {
        httpServer.close();
        wsServer.close();
        await exiftool.end();
        process.exit(0);
    } catch (err) {
        console.error("Shutdown error:", err);
        process.exit(1);
    }
}

process.addListener('SIGTERM', () => shutdown('SIGTERM'));
process.addListener('SIGINT', () => shutdown('SIGINT'));
