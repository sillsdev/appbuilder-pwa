import { type PlanItem } from '$lib/data/plans';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ depends }) => {
    // Make annotations more resiliant to changes in book collection ids over time.
    // Ignore entries if we don't currently have a collection for the entry.
    // This can happen during testing of different PWA at the same port and we don't
    // want to break the feature.
    depends('note:plans');
    return { plans: [] as PlanItem[] };
};
