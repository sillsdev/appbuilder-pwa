import { writable, get, derived } from 'svelte/store';
import { setDefaultStorage } from './storage';
import config from '../config';
import { getLastPlanState, planStatesLastUpdated } from '../planStates';
import { getPlanData } from '../plansData';

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
    planNextReferenceIndex: number;
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
    planNextReferenceIndex: -1,
    completed: false
};
setDefaultStorage('plan', JSON.stringify(defaultPlanStore));
export const plan = writable(JSON.parse(localStorage.plan));
plan.subscribe((value) => (localStorage.plan = JSON.stringify(value)));

export const currentPlanState = writable('');
export const currentPlanData = writable(null);
plan.subscribe(($plan) => {
    if ($plan) {
        updatePlanState($plan.planId);
        updatePlanData($plan.planId);
    }
});
planStatesLastUpdated.subscribe(() => {
    const $plan = get(plan); // Get the current plan value
    if ($plan) {
        updatePlanState($plan.planId);
    }
})
// Function to update the current plan state
async function updatePlanState(planId) {
    if (planId) {
        const result = await getLastPlanState(planId);
        currentPlanState.set(result);
    }
}
async function updatePlanData(planId) {
    if (config.plans) {
        const allPlans = config.plans.plans;
        const planConfig = allPlans.find((x) => x.id === planId);
        if (planConfig) {
            const result = await getPlanData(fetch, planConfig);
            currentPlanData.set(result);
        }
    }
}
