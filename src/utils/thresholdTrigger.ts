export const createThresholdTrigger = (threshold: number, onTrigger: () => void) => {
    let accumulated = 0;
    let triggered = false;

    const step = () => {
        if (triggered) return;

        accumulated++;
        if (accumulated < threshold) return;
        triggered = true;

        try {
            onTrigger();
        } catch (err) {
            console.error("Error in threshold trigger handler:", err);
        }
    };

    const reset = () => {
        accumulated = 0;
        triggered = false;
    };

    const getAccumulated = () => accumulated;
    const isTriggered = () => triggered;

    return { step, reset, getAccumulated, isTriggered };
};
