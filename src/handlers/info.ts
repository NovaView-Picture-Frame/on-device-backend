import type { Context } from 'koa';

import config from '../utils/config';

const info = {
    data: {
        aspect_ratio: config.screenWidth / config.screenHeight,
        size_limit: config.sizeLimit,
    },
};

export default (ctx: Context) => ctx.body = info;
