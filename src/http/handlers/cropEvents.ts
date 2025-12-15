import { buildPre, buildBase, type TaskEventsGetter } from "../buildTaskEventsHandler";
import { cropTasksMap } from "../../services/images";

const getTaskEvents: TaskEventsGetter = taskId => {
    const tasks = cropTasksMap.get(taskId);
    if (!tasks) return;

    return {
        crop: tasks.tasks.crop.then(
            region => ({ region }),
            () => {
                throw { message: "Failed to create cropped image" };
            },
        ),
        persist: tasks.tasks.persist.then(
            () => null,
            () => {
                throw { message: "Failed to persist image data" };
            },
        ),
    };
};

export const cropEventsHandler = {
    pre: buildPre(getTaskEvents),
    base: buildBase(),
};
