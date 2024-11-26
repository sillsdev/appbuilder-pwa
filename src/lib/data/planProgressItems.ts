import { openDB, type DBSchema } from 'idb';
import { writable } from 'svelte/store';
import { invalidate } from '$app/navigation';
import type { PlanDataItem, PlansData } from './plansData';

export interface PlanProgressItem {
    id: string;
    day: number;
    itemIndex: number;
    date: number;
}

interface PlanProgressItems extends DBSchema {
    planprogressitems: {
        key: number;
        value: PlanProgressItem;
        indexes: {
            planIndex: string;
            dayIndex: [string, number];
            singleItemIndex: [string, number, number];
        };
    };
}

let planProgressItemsDB = null;

async function openPlanProgressItems() {
    if (!planProgressItemsDB) {
        planProgressItemsDB = await openDB<PlanProgressItems>('planprogressitems', 1, {
            upgrade(db) {
                const planProgressItemStore = db.createObjectStore('planprogressitems', {
                    keyPath: 'key',
                    autoIncrement: true
                });
                planProgressItemStore.createIndex('planIndex', 'id');
                planProgressItemStore.createIndex('dayIndex', ['id', 'day']);
                planProgressItemStore.createIndex('singleItemIndex', ['id', 'day', 'itemIndex']);
            }
        });
    }
    return planProgressItemsDB;
}
export async function addPlanProgressItem(item: { id: string; day: number; itemIndex: number }) {
    const planProgressItems = await openPlanProgressItems();
    const date = new Date()[Symbol.toPrimitive]('number');
    const nextItem = { ...item, date: date };
    const tx = planProgressItems.transaction('planprogressitems', 'readwrite');
    const index = tx.store.index('singleItemIndex');
    const planProgressRecords = await index.getAll([item.id, item.day, item.itemIndex]);
    if (planProgressRecords.length === 0) {
        await tx.store.add(nextItem);
        await tx.done;
        notifyUpdatedPlanStates();
    }
}
export async function getAllProgressItemsForPlan(planId: string): Promise<[PlanProgressItem]> {
    const db = await openPlanProgressItems();
    const tx = db.transaction('planprogressitems');
    const index = tx.store.index('planIndex');
    const planProgressRecords = await index.getAll(planId);
    return planProgressRecords;
}
export async function deleteAllProgressItemsForPlan(planId: string) {
    if (planId) {
        const db = await openPlanProgressItems();
        const tx = db.transaction('planprogressitems', 'readwrite');
        const index = tx.store.index('planIndex');
        const planProgressRecords = await index.getAllKeys(planId);
        for (const key of planProgressRecords) {
            await tx.store.delete(key);
        }
        await tx.done;
        console.log(`Plan: Deleted ${planProgressRecords.length} records with plan ID "${planId}"`);
    }
}
export async function getCompletedRefsForDay(planId: string, planDay: number): Promise<[number]> {
    const db = await openPlanProgressItems();
    const tx = db.transaction('planprogressitems');
    const index = tx.store.index('dayIndex');
    const planProgressRecords = await index.getAll([planId, planDay]);
    const completedRefsForDay = planProgressRecords.map(
        (planProgressRecord) => planProgressRecord.itemIndex
    );
    return completedRefsForDay;
}
export async function getFirstIncompleteDay(planData: PlansData, excludeDay: number): Promise<number> {
    let nextIncompleteDay = -1;
    for (let i = 0; i < planData.items.length; i++) {
        const completedRefs = await getCompletedRefsForDay(planData.id, planData.items[i].day);
        if (completedRefs.length !== planData.items[i].refs.length) {
            // This day has some items that are not completed
            if (planData.items[i].day !== excludeDay) {
                nextIncompleteDay = planData.items[i].day;
                break;
            }
        }
    }
    return nextIncompleteDay;
}
export async function getNextPlanReference(
    planId: string,
    planItem: PlanDataItem,
    currentIndex: number
): Promise<[string, number]> {
    let nextReference = '';
    let nextReferenceIndex = -1;

    const completedRefsForDay = await getCompletedRefsForDay(planId, planItem.day);
    for (let i = 0; i < planItem.refs.length; i++) {
        if (!completedRefsForDay.includes(i) && i !== currentIndex) {
            nextReferenceIndex = i;
            nextReference = planItem.refs[nextReferenceIndex];
            break;
        }
    }
    return [nextReference, nextReferenceIndex];
}
function notifyUpdatedPlanStates() {
    planProgressItemsLastUpdated.set(Date.now());
    invalidate('planprogressitems');
}

export const planProgressItemsLastUpdated = writable(Date.now());
