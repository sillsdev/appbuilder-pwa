import { getAllProgressItemsForPlan } from '$lib/data/planProgressItems';
import config from '../../../lib/data/config';
import { getPlanData } from '../../../lib/data/plansData';

export async function load({ params, fetch }) {
    const allPlans = config.plans.plans;

    const id = params.id;

    const planConfig = allPlans.find((x) => x.id === id);

    const planData = await getPlanData(fetch, planConfig);

    const planCompletionData = await getAllProgressItemsForPlan(id);

    return { planConfig, planData, planCompletionData };
}
