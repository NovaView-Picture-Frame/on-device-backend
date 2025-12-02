interface Slot {
    id: string;
    startTime: Date;
    duration: number;
    payload: {
        id: number;
    };
}

export interface ScheduleMessage {
    type: 'newSchedule';
    acceptableDelay: number;
    slots: Slot[];
}
