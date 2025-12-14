import fastifySSE from '@fastify/sse';
import type { FastifyInstance } from 'fastify';

import { infoHandler } from './handlers/info';
import { uploadHandler } from './handlers/upload';
import { uploadEventsHandler } from './handlers/uploadEvents';
import { queryHandler } from './handlers/query';
import { previewHandler } from './handlers/preview';
import { deleteHandler } from './handlers/delete';
import { cropHandler } from './handlers/crop';
import { cropEventsHandler } from './handlers/cropEvents';

export const httpRoutes = (fastify: FastifyInstance) => {
    fastify.get('/info', infoHandler);
    fastify.post('/query', queryHandler);
    fastify.get('/preview/:id', previewHandler);
    fastify.delete('/delete/:id', deleteHandler);
    fastify.post('/crop/:id', cropHandler);
}

export const sseRoutes = async (fastify: FastifyInstance) => {
    await fastify.register(fastifySSE);

    fastify.get(
        '/upload/events/:taskId',
        {
            sse: true,
            preHandler: uploadEventsHandler.pre,
        },
        uploadEventsHandler.base,
    );
    fastify.get(
        '/crop/events/:taskId',
        {
            sse: true,
            preHandler: cropEventsHandler.pre,
        },
        cropEventsHandler.base,
    );
}

export const rawHttpRoutes = (fastify: FastifyInstance) => {
    fastify.addContentTypeParser('*', (_, payload, done) =>
        done(null, payload)
    );

    fastify.post('/upload', uploadHandler);
}
