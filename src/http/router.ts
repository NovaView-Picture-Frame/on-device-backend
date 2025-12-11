import Router from '@koa/router';
import bodyParser from '@koa/bodyparser';

import { infoHandler } from './handlers/info';
import { uploadHandler } from './handlers/upload';
import { uploadEventsHandler } from './handlers/uploadEvents';
import { queryHandler } from './handlers/query';
import { previewHandler } from './handlers/preview';
import { deleteHandler } from './handlers/delete';
import { cropHandler } from './handlers/crop';
import { cropEventsHandler } from './handlers/cropEvents';

export const buildHttpRouters = () => ({
    router: new Router()
        .get('/info', infoHandler)
        .post('/upload', uploadHandler)
        .get('/upload/:taskId/events', uploadEventsHandler)
        .post('/query', queryHandler)
        .get('/preview/:id', previewHandler)
        .delete('/delete/:id', deleteHandler)
        .get('/crop/:taskId/events', cropEventsHandler),

    bodyRouter: new Router()
        .use(bodyParser())
        .post('/crop/:id', cropHandler),
});
