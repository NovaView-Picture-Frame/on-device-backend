import type { Context, Next } from 'koa';
import { isHttpError } from 'http-errors-enhanced';

export default async (ctx: Context, next: Next) => {
    try {
        await next();
    } catch (err) {
        if (isHttpError(err)) {
            ctx.status = err.statusCode;
            ctx.body = {
                error: err.message,
            };
        } else {
            ctx.status = 500;
            ctx.body = {
                error: {
                    message: "Internal Server Error",
                },
            };
            
            console.error("Unexpected error: ", err);
        }
    }
}
