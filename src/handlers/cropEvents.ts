import { tasksMap } from '../services/crop';
import { buildTaskEventsHandler, type TaskEventsGetter } from '../services/buildTaskEventsHandler';

const getTaskEvents: TaskEventsGetter = (taskId) => {
    const tasks = tasksMap.get(taskId);
    if (!tasks) return;

    return {
        crop: tasks.tasks.crop.then(
            region => ({ region }),
            () => { throw { message: "Failed to create cropped image" } }
        ),
        persist: tasks.tasks.persist.then(
            () => null,
            () => { throw { message: "Failed to persist image data" } }
        ),
    }
}

export default buildTaskEventsHandler(getTaskEvents);
