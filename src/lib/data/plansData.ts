import { base } from '$app/paths';

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
    return planData;
}
