import { openDB, type DBSchema } from 'idb';

/* 
Database Information - from the issue 
This is for reference purposes.
The Android and iOS apps save the information about the plan states in 3 database tables.

The first is a plan setup table. This contains the plans and associated features, 
most of which are not discussed in this issue (things like the day of weeks and reminder times associated with the plan).

The second table is a plan state which contains an entry (plan id, state, date) 
for each time the plan state changed and the state it changed to
(available, in progress or completed).
When checking a plan, the most recent entry sets the state of the plan. 
If no entry is present, the plan is "available". 

The final table is a plan progress entry (plan id, day, entry index, date) 
which contains an entry for each reference that has been marked as "read".

*/

//made this based on the key value pairs in config.js, should it be something else?
export interface PlanItem {
    id: string;
    days: number;
    title: {
        [lang: string]: string;
    };
    filename: string;
    image?: {
        width: string;
        height: string;
        file: string;
    };
}

interface Plans extends DBSchema {
    plans: {
        key: number;
        value: PlanItem;
        indexes: {
            id: string; //do I need to use date instead?
        };
    };
}

let planDB = null;

async function openPlans() {
    if (!planDB) {
        planDB = await openDB<Plans>('plans', 1, {
            upgrade(db) {
                const planStore = db.createObjectStore('plans', {
                    keyPath: 'id'
                });

                planStore.createIndex('id', 'id');
            }
        });
    }
    return planDB;
}

export async function getPlans(): Promise<PlanItem[]> {
    const plans = await openPlans();
    return await plans.getAll('plans');
}
