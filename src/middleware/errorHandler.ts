import type { FastifyInstance } from "fastify";

abstract class HttpError extends Error {
    abstract status: number;

    constructor(message: string) {
        super(message);
    }
}

export class HttpBadRequestError extends HttpError {
    status = 400;
}

export class HttpNotFoundError extends HttpError {
    status = 404;
}

export const errorHandler: FastifyInstance["errorHandler"] = (error, _, reply) => {
    if (error instanceof HttpError) {
        reply.status(error.status).send({ error: error.message });
        return;
    }

    reply.status(500).send({ error: "Internal Server Error" });
    console.error("Unexpected error: ", error);
};
