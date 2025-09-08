import type { Context, Next } from 'koa';

abstract class HttpError extends Error {
    abstract status: number;

    constructor(message: string) {
        super(message);
    }
}

export class HttpBadRequestError extends HttpError { status = 400; };
export class HttpNotFoundError extends HttpError { status = 404; };

export const errorHandler = async (ctx: Context, next: Next) => {
    try {
        await next();
    } catch (err) {
        if (err instanceof HttpError) {
            ctx.status = err.status;
            ctx.body = {
                error: err.message,
            };
        } else {
            ctx.status = 500;
            ctx.body = {
                error: "Internal Server Error",
            };

            console.error("Unexpected error: ", err);
        }
    }
}
