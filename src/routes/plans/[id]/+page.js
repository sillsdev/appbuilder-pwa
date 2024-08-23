import config from '../../../lib/data/config';
import { base } from '$app/paths';

export async function load({ params, fetch }) {
    const allPlans = config.plans.plans;

    const id = params.id;

    const planConfig = allPlans.find((x) => x.id === id);

    console.log('plan:', planConfig);

    const src = `${base}/plans/${planConfig.jsonFilename}`;
    let planData;

    try {
        const response = await fetch(src);

        if (!response.ok) {
            throw new Error('Failed to fetch plan JSON file');
        }

        planData = await response.json();
    } catch (error) {
        console.error('Error fetching plan JSON file:', error);
    }

    return { planConfig, planData };
}
