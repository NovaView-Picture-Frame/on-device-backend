import websocket from "@fastify/websocket";
import type { FastifyInstance } from "fastify";

import { carouselUpgradeHandler, carouselHandler } from "./handlers/carousel";

export const wsRoutes = async (fastify: FastifyInstance) => {
    await fastify.register(websocket);

    fastify.get(
        "/carousel",
        { websocket: true, preValidation: carouselUpgradeHandler },
        carouselHandler,
    );
};
