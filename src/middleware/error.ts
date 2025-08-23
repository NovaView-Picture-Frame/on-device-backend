import type { Context, Next } from 'koa';

abstract class HttpError extends Error {
    abstract status: number;

    constructor(message: string) {
        super(message);
    }
}

export class BadRequestError extends HttpError {
    status = 400;
}

export class NotFoundError extends HttpError {
    status = 404;
}

export default async (ctx: Context, next: Next) => {
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
