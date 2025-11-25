import koa from 'koa';
import bodyParser from '@koa/bodyparser';
import Router from '@koa/router';
import { exiftool } from 'exiftool-vendored';

import { errorHandler } from './middleware/errorHandler';
import config from './config';

import infoHandler from './handlers/info';
import uploadHandler from './handlers/upload';
import uploadEventsHandler from './handlers/uploadEvents';
import queryHandler from './handlers/query';
import previewHandler from './handlers/preview';
import cropHandler from './handlers/crop';
import cropEventsHandler from './handlers/cropEvents';

const app = new koa();
app.use(errorHandler);

const router = new Router()
    .get('/info', infoHandler)
    .post('/upload', uploadHandler)
    .get('/upload/:taskId/events', uploadEventsHandler)
    .post('/query', queryHandler)
    .get('/preview/:id', previewHandler)
    .get('/crop/:taskId/events', cropEventsHandler);

const bodyRouter = new Router()
    .use(bodyParser())
    .post('/crop/:id', cropHandler);

app.use(router.routes());
app.use(bodyRouter.routes());

const server = app.listen(config.port, () =>
    console.log(`Server listening on port ${config.port}`)
);

const shutdown = async (signal: string) => {
    console.log(`Received ${signal}, shutting down...`);
    try {
        server.close();
        await exiftool.end();
        process.exit(0);
    } catch (err) {
        console.error("Shutdown error:", err);
        process.exit(1);
    }
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
