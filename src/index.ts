import koa from 'koa';
import bodyParser from '@koa/bodyparser';
import Router from '@koa/router';

import { errorHandler } from './middleware/errorHandler';
import infoHandler from './handlers/info';
import uploadHandler from './handlers/upload';
import uploadEventsHandler from './handlers/uploadEvents';
import listHandler from './handlers/list';
import previewHandler from './handlers/preview';
import cropHandler from './handlers/crop';
import cropEventsHandler from './handlers/cropEvents';

import config from './utils/config';

const app = new koa();
app.use(errorHandler);
app.use(bodyParser());

const router = new Router();
router.get('/info', infoHandler);
router.post('/upload', uploadHandler);
router.get('/upload/:taskId/events', uploadEventsHandler);
router.get('/list', listHandler);
router.get('/preview/:id', previewHandler);
router.post('/crop/:id', cropHandler);
router.get('/crop/:taskId/events', cropEventsHandler);

app.use(router.routes());
app.listen(config.port, () =>
    console.log(`Server listening on port ${config.port}`)
);
