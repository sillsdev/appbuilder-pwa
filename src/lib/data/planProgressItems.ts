import { openDB, type DBSchema } from 'idb';
import { writable } from 'svelte/store';
import { invalidate } from '$app/navigation';

export interface PlanProgressItem {
    id: string;
    day: number;
    item_index: number;
    date: number;
}

interface PlanProgressItems extends DBSchema {
    planstates: {
        key: number;
        value: PlanProgressItem;
        indexes: {
            planIndex: string;
            dayIndex: [string, string];
        };
    };
}
