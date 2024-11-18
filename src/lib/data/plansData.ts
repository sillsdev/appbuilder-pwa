import { base } from '$app/paths';

let fetchFn = fetch;

export type PlanItem = {
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

    items?: PlanItem[];
};

export async function getPlanData(planConfig: any): Promise<PlansData> {
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

export async function getNextPlanReference(planConfig: any, planItem: PlanItem, currentIndex: number ): Promise<string> {
    let planData = await getPlanData(planConfig);
    let nextReference;
    if (planData) {
        // This needs to be expanded to check for first incomplete item in the list
        // once the database for the progress is completed
        if (planItem.refs.length + 1 > currentIndex) {
            nextReference = planItem.refs[currentIndex + 1];
        }
    }
    return nextReference;
}
