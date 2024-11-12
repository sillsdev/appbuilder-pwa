import { openDB, type DBSchema } from 'idb';
import { writable } from 'svelte/store';
import { invalidate } from '$app/navigation';

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
export interface PlanState {
    id: string;
    state: string;
    date: number;
}
interface PlanStates extends DBSchema {
    planstates: {
        key: number;
        value: PlanState;
        indexes: {
            idIndex: string;
        };
    };
}

let planStateDB = null;

async function openPlanStates() {
    if (!planStateDB) {
        planStateDB = await openDB<PlanStates>('planstates', 1, {
            upgrade(db) {
                const planStateStore = db.createObjectStore('planstates', {
                    keyPath: 'key',
                    autoIncrement: true
                });

                planStateStore.createIndex('idIndex', 'id');
            }
        });
    }
    return planStateDB;
}

export async function getPlanStates(): Promise<PlanState[]> {
    const planstates = await openPlanStates();
    return await planstates.getAll('planstates');
}

export async function getLastPlanState(id: string) {
    const planstates = await openPlanStates();
    const tx = planstates.transaction('planstates', 'readonly');
    const store = tx.objectStore('planstates');
    const index = store.index('idIndex');
    const records = await index.getAll(id);
    await tx.done;
    if (records.length === 0) {
        return null;
    }

    const mostRecentRecord = records.reduce((latest, current) => {
        return current.date > latest.date ? current : latest;
    }, records[0]);
    return mostRecentRecord.state;
}

export async function addPlanState(item: { id: string; state: string }) {
    const planStates = await openPlanStates();
    const date = new Date()[Symbol.toPrimitive]('number');
    const nextItem = { ...item, date: date };
    const tx = planStates.transaction('planstates', 'readwrite');
    await tx.store.add(nextItem);
    await tx.done;
    notifyUpdatedPlanStates();
}

function notifyUpdatedPlanStates() {
    planStatesLastUpdated.set(Date.now());
    invalidate('planstates');
}
export const planStatesLastUpdated = writable(Date.now());
