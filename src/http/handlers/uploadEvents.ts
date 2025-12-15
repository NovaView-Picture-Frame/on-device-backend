import { buildPre, buildBase, type TaskEventsGetter } from "../buildTaskEventsHandler";
import { uploadTasksMap } from "../../services/images";

const getTaskEvents: TaskEventsGetter = taskId => {
    const tasks = uploadTasksMap.get(taskId);
    if (!tasks) return;

    return {
        lookupPlace: tasks.lookupPlace.then(
            place => ({ place }),
            () => {
                throw { message: "Failed to look up place" };
            },
        ),
        saveOriginal: tasks.saveOriginal.then(
            () => null,
            () => {
                throw { message: "Failed to save original image" };
            },
        ),
        crop: tasks.crop.then(
            region => ({ region }),
            () => {
                throw { message: "Failed to create cropped image" };
            },
        ),
        optimize: tasks.optimize.then(
            () => null,
            () => {
                throw { message: "Failed to create optimized image" };
            },
        ),
        persist: tasks.persist.then(
            id => ({ id }),
            () => {
                throw { message: "Failed to persist image data" };
            },
        ),
    };
};

export const uploadEventsHandler = {
    pre: buildPre(getTaskEvents),
    base: buildBase(),
};
