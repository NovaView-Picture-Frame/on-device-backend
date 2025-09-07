import koa from 'koa';
import Router from '@koa/router';

import { errorHandler } from './middleware/errorHandler';
import infoHandler from './handlers/info';
import uploadHandler from './handlers/upload';
import uploadEventsHandler from './handlers/uploadEvents';

import config from './utils/config';

const app = new koa();
app.use(errorHandler);

const router = new Router();
router.get('/info', infoHandler);
router.post('/upload', uploadHandler);
router.get('/upload/:taskId/events', uploadEventsHandler);

app.use(router.routes());
app.listen(config.port, () =>
    console.log(`Server listening on port ${config.port}`)
);
