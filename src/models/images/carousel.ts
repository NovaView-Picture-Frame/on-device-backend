export interface Slot {
    id: string;
    startTime: Date;
    duration: number;
    payload: {
        id: number;
    };
}

export class ScheduleMessage {
    public readonly type = 'newSchedule';
    public readonly acceptableDelay;
    public readonly slots;

    constructor(acceptableDelay: number, slots: Slot[]) {
        this.acceptableDelay = acceptableDelay;
        this.slots = slots;
    }
}
