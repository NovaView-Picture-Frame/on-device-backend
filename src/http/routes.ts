import fastifySSE from "@fastify/sse";
import type { FastifyInstance } from "fastify";

import { infoHandler } from "./handlers/info";
import { previewHandler } from "./handlers/preview";
import { deleteHandler } from "./handlers/delete";
import { cropHandler } from "./handlers/crop";
import { graphqlHandler } from "./handlers/graphql";
import { uploadHandler } from "./handlers/upload";
import { uploadEventsHandler } from "./handlers/uploadEvents";
import { cropEventsHandler } from "./handlers/cropEvents";

export const httpRoutes = (fastify: FastifyInstance) => {
    fastify.get("/info", infoHandler);
    fastify.get("/preview/:id", previewHandler);
    fastify.delete("/delete/:id", deleteHandler);
    fastify.post("/crop/:id", cropHandler);
    fastify.post("/graphql", graphqlHandler);
};

export const binaryRoutes = (fastify: FastifyInstance) => {
    fastify.addContentTypeParser("*", (_, payload, done) => done(null, payload));

    fastify.post("/upload", uploadHandler);
};

export const sseRoutes = async (fastify: FastifyInstance) => {
    await fastify.register(fastifySSE);

    fastify.get(
        "/upload/events/:taskId",
        { sse: true, preHandler: uploadEventsHandler.pre },
        uploadEventsHandler.base,
    );
    fastify.get(
        "/crop/events/:taskId",
        { sse: true, preHandler: cropEventsHandler.pre },
        cropEventsHandler.base,
    );
};
