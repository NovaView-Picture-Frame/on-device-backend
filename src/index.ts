import Koa from 'koa';
import Router from '@koa/router';

import errorHandler from './middleware/error.js';
import infoHandler from './handlers/info.js';
import uploadHandler from './handlers/upload.js';
import uploadCheckHandler from './handlers/uploadCheck.js';
import config from './utils/config.js';

const app = new Koa();
const router = new Router();

app.use(errorHandler);

router.get('/info', infoHandler);
router.post('/upload', uploadHandler);
router.get('/upload/check/:hash', uploadCheckHandler);

app.use(router.routes());

app.listen(config.port, () =>
    console.log(`Server listening on port ${config.port}`)
);
