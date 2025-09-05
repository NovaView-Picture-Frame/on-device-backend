import koa from 'koa';

import config from './utils/config';

const app = new koa();

app.listen(config.port, () =>
    console.log(`Server listening on port ${config.port}`)
);
