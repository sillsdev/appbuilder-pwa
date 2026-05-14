import { scriptureConfig } from '$assets/config';

export async function load({ params }) {
    const allPlans = scriptureConfig.plans?.plans ?? [];

    const id = params.id;

    const planConfig = allPlans.find((x) => x.id === id);
    return { planConfig };
}
