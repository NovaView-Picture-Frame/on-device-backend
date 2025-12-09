import type { Context } from 'koa';

import { config } from '../config';

const body = {
    data: {
        screen_width: config.screenWidth,
        screen_height: config.screenHeight,
        size_limit: config.sizeLimitBytes,
    },
};

export const infoHandler = (ctx: Context) =>
    ctx.body = body;
