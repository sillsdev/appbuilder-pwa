import { getHistory } from '$lib/data/history';

/** @type {import('./$types').PageLoad} */
export async function load() {
    const history = await getHistory();
    return { history };
}
