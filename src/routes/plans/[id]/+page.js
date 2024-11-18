import config from '../../../lib/data/config';
import { getPlanData } from '../../../lib/data/PlansData';

export async function load({ params, fetch }) {
    const allPlans = config.plans.plans;

    const id = params.id;

    const planConfig = allPlans.find((x) => x.id === id);

    console.log('plan:', planConfig);

    let planData = await getPlanData(planConfig);

    return { planConfig, planData };
}
