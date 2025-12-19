import {
    listIdAndRevisionUnordered,
    listIdAndRevisionByCreated,
    listIdAndRevisionByTaken,
} from "../../../repositories/images";
import { toSlotImage } from "../../../models/images";
import type { Order, SlotImage } from "../../../models/carousel";

const orderMapping = {
    random: () => listIdAndRevisionUnordered(),
    createdAsc: () => listIdAndRevisionByCreated(true),
    createdDesc: () => listIdAndRevisionByCreated(),
    takenAsc: () => listIdAndRevisionByTaken(true),
    takenDesc: () => listIdAndRevisionByTaken(),
};

export const listSlotImages = (order: Order): SlotImage[] => {
    const images = orderMapping[order]();
    return images.map(toSlotImage);
};
