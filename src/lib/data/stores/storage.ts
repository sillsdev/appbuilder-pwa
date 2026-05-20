export const setDefaultStorage = (name: string, value: string) => {
    if (!localStorage.getItem(name) && value) {
        localStorage.setItem(name, value);
    }
};

export const mergeDefaultStorage = (name: string, value?: Record<string, unknown>) => {
    const storage = localStorage.getItem(name);
    if (!storage && value) {
        // If it doesn't exist, then just store it
        localStorage.setItem(name, JSON.stringify(value));
    } else if (storage && value) {
        // If it does exist, then set the keys that don't exist
        const update = JSON.parse(storage);
        Object.keys(value).forEach((key) => {
            if (!Object.hasOwn(update, key)) {
                update[key] = value[key];
            }
        });
        localStorage.setItem(name, JSON.stringify(update));
    }
};
