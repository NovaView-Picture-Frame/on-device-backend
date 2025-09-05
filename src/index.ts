import koa from 'koa';
import Router from '@koa/router';

import infoHandler from './handlers/info';
import config from './utils/config';

const app = new koa();

const router = new Router();
router.get('/info', infoHandler);

app.use(router.routes());
app.listen(config.port, () =>
    console.log(`Server listening on port ${config.port}`)
);
