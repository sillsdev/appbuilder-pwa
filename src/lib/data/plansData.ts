import { base } from '$app/paths';

const plans = import.meta.glob('./*', {
    eager: true,
    query: '?url', // this is important to get url instead of JSON
    base: '/src/generatedAssets/plans'
}) as Record<string, { default: string }>;

export type PlanDataItem = {
    day: number;
    heading?: {
        [lang: string]: string;
    };
    refs: string[];
};

export type PlansData = {
    id: string;
    title?: {
        [lang: string]: string;
    };
    description?: {
        [lang: string]: string;
    };
    image?: string;

    items?: PlanDataItem[];
};

export async function getPlanData(fetch: any, planConfig: any): Promise<PlansData> {
    let planData;

    try {
        const key = `./${planConfig.jsonFilename}`;
        const entry = plans[key];
        if (!entry?.default) {
            throw new Error(`Plan JSON asset not found for key ${key}`);
        }

        const response = await fetch(entry.default);

        if (!response.ok) {
            throw new Error('Failed to fetch plan JSON file');
        }

        planData = await response.json();
    } catch (error) {
        console.error('Error fetching plan JSON file:', error);
    }
    return planData;
}
