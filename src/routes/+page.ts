import type { PageLoad } from './$types';

export const load: PageLoad = async ({ url }) => {
    const ref = url.searchParams.get('ref');
    const audio = url.searchParams.get('audio');

    return { ref, audio };
};
