import { scriptureConfig } from '$assets/config';
import { getHistory } from '$lib/data/history';
import type { PageLoad } from './$types';

export const load: PageLoad = async () => {
    const allHistory = await getHistory();

    // Make history more resiliant to changes in book collection ids over time.
    // Ignore entries if we don't currently have a collection for the entry.
    // This can happen during testing of different PWA at the same port and we don't
    // want to break the feature.
    const history = allHistory.filter((item) =>
        scriptureConfig.bookCollections?.some((collection) => collection.id === item.collection)
    );
    return { history };
};
