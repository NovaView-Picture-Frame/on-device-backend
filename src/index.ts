import koa from 'koa';
import bodyParser from '@koa/bodyparser';
import Router from '@koa/router';

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
app.use(bodyParser());

const router = new Router();
router.get('/info', infoHandler);
router.post('/upload', uploadHandler);
router.get('/upload/:taskId/events', uploadEventsHandler);
router.post('/query', queryHandler);
router.get('/preview/:id', previewHandler);
router.post('/crop/:id', cropHandler);
router.get('/crop/:taskId/events', cropEventsHandler);

app.use(router.routes());
app.listen(config.port, () =>
    console.log(`Server listening on port ${config.port}`)
);
