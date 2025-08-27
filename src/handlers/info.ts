import type { Context } from 'koa';
import config from '../utils/config';

const aspect_ratio = config.screen_width / config.screen_height;

export default (ctx: Context) =>
    ctx.body = {
        data: {
            aspect_ratio,
            size_limit: config.size_limit,
        }
    };
