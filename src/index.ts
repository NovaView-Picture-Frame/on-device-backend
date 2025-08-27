import Koa from 'koa';
import bodyParser from '@koa/bodyparser';
import Router from '@koa/router';

import errorHandlingMiddleware, { BadRequestError } from './middleware/error';

import infoHandler from './handlers/info';
import uploadHandler from './handlers/upload';
import queryByHashHandler from './handlers/queryByHash';
import offsetHandler from './handlers/offset';
import deleteHandler from './handlers/delete';

import config from './utils/config';

const app = new Koa();

app.use(errorHandlingMiddleware);
app.use(bodyParser({
    onError: () => {
        throw new BadRequestError("Invalid JSON body");
    },
}));

const router = new Router();
router.get('/info', infoHandler);
router.post('/images', uploadHandler);
router.post('/images/query/hash', queryByHashHandler);
router.patch('/images/:id/offset', offsetHandler);
router.delete('/images/:id', deleteHandler);

app.use(router.routes());
app.listen(config.port, () =>
    console.log(`Server listening on port ${config.port}`)
);
