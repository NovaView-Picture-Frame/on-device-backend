import { listIdUnordered, listIdByCreated, listIdByTaken } from "../../../repositories/images";
import type { Order } from "../../../models/carousel";

const orderMapping = {
    random: () => listIdUnordered(),
    createdAsc: () => listIdByCreated(true),
    createdDesc: () => listIdByCreated(),
    takenAsc: () => listIdByTaken(true),
    takenDesc: () => listIdByTaken(),
};

export const getIds = (order: Order) => orderMapping[order]();
