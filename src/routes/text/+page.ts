import { initProskomma } from '$lib/data/scripture';
import type { PageLoad } from './$types';

export const load: PageLoad = async () => {
    const proskomma = await initProskomma();
    return { fetch, proskomma };
};
