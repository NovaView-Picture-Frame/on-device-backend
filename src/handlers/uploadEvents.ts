import { tasksMap } from '../services/upload';
import buildTaskEventsHandler from '../services/buildTaskEventsHandler';
import type { TaskEventsGetter } from '../services/buildTaskEventsHandler';

const getTaskEvents: TaskEventsGetter = (taskId) => {
    const tasks = tasksMap.get(taskId);
    if (!tasks) return;

    return {
        lookupPlace: tasks.lookupPlace.then(
            place => ({ place }),
            () => { throw { message: "Failed to look up place" }; }
        ),
        saveOriginal: tasks.saveOriginal.then(
            () => null,
            () => { throw { message: "Failed to save original image" }; }
        ),
        crop: tasks.crop.then(
            region => ({ region }),
            () => { throw { message: "Failed to create cropped image" }; }
        ),
        optimize: tasks.optimize.then(
            () => null,
            () => { throw { message: "Failed to create optimized image" }; }
        ),
        persist: tasks.persist.then(
            id => ({ id }),
            () => { throw { message: "Failed to persist image data" }; }
        ),
    };
};

export default buildTaskEventsHandler(getTaskEvents);
