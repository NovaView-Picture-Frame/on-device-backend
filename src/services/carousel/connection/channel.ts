
import type { UUID } from "node:crypto";

import type { CarouselServerMessage, CarouselClientMessage } from "../../../models/carousel";
import { subscribeSchedule, requestSchedule, switchOrder } from "../schedule/runtime";

export const createCarouselChannel = (
    clientId: UUID,
    dispatchMessage: (message: CarouselServerMessage) => void,
) => {
    const unsubscribeSchedule = subscribeSchedule(clientId, message => dispatchMessage(message));

    const onClientMessage = (message: CarouselClientMessage) => {
        switch (message.type) {
            case "requestSchedule":
                requestSchedule(clientId, message.windowSize);
                break;

            case "preloadComplete":
                console.log(`${message.id} preload complete for client:`, clientId);
                break;

            case "switchOrder":
                switchOrder(message.newOrder, "restart");
                console.log(`Switching order to ${message.newOrder} by client:`, clientId);
                break;

            default:
                message satisfies never;
        };
    };

    const dispose = () => {
        try {
            unsubscribeSchedule();
        } catch (err) {
            console.error("Error unsubscribing from schedule:", err);
        };
    };

    return { onClientMessage, dispose };
};
