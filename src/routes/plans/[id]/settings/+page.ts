import { scriptureConfig } from '$assets/config';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params }) => {
    const allPlans = scriptureConfig.plans?.plans ?? [];

    const id = params.id;

    const planConfig = allPlans.find((x) => x.id === id);
    return { planConfig };
};
