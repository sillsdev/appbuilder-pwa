import { scriptureConfig } from '$assets/config';
import { getAllProgressItemsForPlan } from '$lib/data/planProgressItems';
import { getPlanData } from '../../../lib/data/plansData';

export async function load({ params, fetch }) {
    const allPlans = scriptureConfig.plans?.plans ?? [];

    const id = params.id;

    const planConfig = allPlans.find((x) => x.id === id);

    const planData = await getPlanData(fetch, planConfig);

    const planCompletionData = await getAllProgressItemsForPlan(id);

    return { planConfig, planData, planCompletionData };
}
