import config from '../../../../lib/data/config';

export async function load({ params }) {
    const allPlans = config.plans.plans;

    const id = params.id;

    const planConfig = allPlans.find((x) => x.id === id);
    return { planConfig };
}
