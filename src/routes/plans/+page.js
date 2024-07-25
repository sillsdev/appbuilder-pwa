import { getPlans } from '$lib/data/plans';
import config from '$lib/data/config';

/** @type {import('./$types').PageLoad} */
export async function load({ depends }) {
    const allPlans = await getPlans();

    // Make annotations more resiliant to changes in book collection ids over time.
    // Ignore entries if we don't currently have a collection for the entry.
    // This can happen during testing of different PWA at the same port and we don't
    // want to break the feature.
    const plans = allPlans.filter((item) => {
        return config.bookCollections.some((collection) => collection.id === item.collection);
    });
    depends('plans');
    console.log('Plans', plans);
    return { plans };
}