import {
    listIdUnordered,
    listIdByCreated,
    listIdByTaken,
} from '../../../repositories/images';
import type { Order } from '../../../models/carousel';

export const getIds = (order: Order) => {
    switch (order) {
        case 'random':
        return listIdUnordered();

        case 'createdAsc':
        return listIdByCreated(true);

        case 'createdDesc':
        return listIdByCreated();

        case 'takenAsc':
        return listIdByTaken(true);

        case 'takenDesc':
        return listIdByTaken();
    }
}
