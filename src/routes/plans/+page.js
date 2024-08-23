import { getPlans } from '$lib/data/plans';

/** @type {import('./$types').PageLoad} */
export async function load({ depends }) {
    const allPlans = await getPlans();

    // Make annotations more resiliant to changes in book collection ids over time.
    // Ignore entries if we don't currently have a collection for the entry.
    // This can happen during testing of different PWA at the same port and we don't
    // want to break the feature.
    const plans = [
        {
            id: 'MRK16',
            days: 16,
            title: {
                default: 'Mark in 16 days'
            },
            filename: 'plan-mark-16.txt',
            image: {
                width: 910,
                height: 512,
                file: 'plan-mark-16.jpg'
            }
        }
    ];
    depends('plans');
    console.log('Plans', plans);
    return { plans };
}
