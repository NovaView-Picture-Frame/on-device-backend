import type { Context } from 'koa';
import config from '../utils/config.js';

export default (ctx: Context) =>
    ctx.body = {
        data: {
            screen_width: config.screen_width,
            screen_height: config.screen_height,
            size_limit: config.size_limit,
        }
    }
