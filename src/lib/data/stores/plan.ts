import { writable, get, derived } from 'svelte/store';
import { setDefaultStorage } from './storage';
import config from '../config';

interface PlanStore {
    planId: string;
    planDay: number;
    planEntry: number;
    planBookId: string;
    planChapter: number;
    planFromVerse: number;
    planToVerse: number;
    planReference: string;
    planNextReference: string;
    completed: boolean;
}

export function planItemInfo(entry: PlanStore) {
    const allPlans = config.plans.plans;
    const planConfig = allPlans.find((x) => x.id === entry.planId);
}
const defaultPlanStore = {
    planId: '',
    planDay: 0,
    planEntry: -1,
    planBookId: '',
    planChapter: 0,
    planFromVerse: 0,
    planToVerse: 0,
    planReference: '',
    planNextReference: '',
    completed: false
};
setDefaultStorage('plan', JSON.stringify(defaultPlanStore));
export const plan = writable(JSON.parse(localStorage.plan));
plan.subscribe((value) => (localStorage.plan = JSON.stringify(value)));
