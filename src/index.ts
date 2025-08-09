import { parseArgs } from 'node:util';
import Koa from 'koa';
import Router from '@koa/router';

import { parametersSchema } from './schemas/parameters.js';
import errorHandler from './middleware/error.js';
import infoHandlerFactory from './handlers/info.factory.js';
import uploadHandlerFactory from './handlers/upload.factory.js';

const { values } = parseArgs({
    options: {
        port: { type: 'string' },
        screen_width: { type: 'string' },
        screen_height: { type: 'string' },
        size_limit: { type: 'string' },
        work_directory: { type: 'string' },
    },
});

const parameters = parametersSchema.parse(values);

const app = new Koa();
const router = new Router();

app.use(errorHandler);
router.get('/info', infoHandlerFactory(parameters));
router.post('/upload', uploadHandlerFactory(parameters));

app.use(router.routes());
app.listen(parameters.port, () =>
    console.log(`Server listening on port ${parameters.port}`)
)
