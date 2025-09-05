import type { Context } from 'koa';

import config from '../utils/config';

const aspect_ratio = config.screenWidth / config.screenHeight;

export default (ctx: Context) =>
    ctx.body = {
        data: {
            aspect_ratio,
            size_limit: config.sizeLimit,
        }
    };
