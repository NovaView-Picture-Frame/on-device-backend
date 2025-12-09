import {
    listIDUnordered,
    listIDByCreated,
    listIDByTaken,
} from '../../../repositories/images';
import type { Order } from '../../../models/carousel';

export const getIDs = (order: Order) => {
    switch (order) {
        case 'random':
        return listIDUnordered();

        case 'createdAsc':
        return listIDByCreated(true);

        case 'createdDesc':
        return listIDByCreated();

        case 'takenAsc':
        return listIDByTaken(true);

        case 'takenDesc':
        return listIDByTaken();
    }
};
