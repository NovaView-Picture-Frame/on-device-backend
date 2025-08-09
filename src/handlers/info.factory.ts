import type { Context } from 'koa';
import type { Parameters } from '../schemas/parameters.js';

export default (parameters: Parameters) =>
    (ctx: Context) => 
        ctx.body = {
            data: {
                width: parameters.screen_width,
                height: parameters.screen_height,
            }
        }
