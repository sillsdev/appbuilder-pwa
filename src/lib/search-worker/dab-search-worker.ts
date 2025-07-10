import { initializeDatabase } from '$lib/data/stores/lexicon.svelte';
import type { SearchOptions } from '$lib/search/domain/interfaces/data-interfaces';

// Search the dictionary based on the phrase and options
export async function searchDictionary(phrase: string, options: SearchOptions) {
    const searchWords = phrase.trim().split(/\s+/).filter(Boolean);

    const column = options.accentsAndTones ? 'word' : 'word_no_accents';

    const db = await initializeDatabase({ fetch });
    const dynamicQuery = searchWords.map(() => `${column} LIKE ?`).join(' OR ');
    const dynamicParams = searchWords.map((word) => (options.wholeWords ? word : `%${word}%`));
    const results = db.exec(`SELECT locations FROM search_words WHERE ${dynamicQuery}`, dynamicParams);
    console.log('results:', results);

    if (!results?.length || !results[0]?.values?.length) {
        return [];
    }

    // Extract and process locations from the query result
    const locations = results[0].values
        .flatMap((value) =>
            (value[0] as string | null)?.split(' ').map((loc) => {
                const [id, weight] = loc.split('(').map((v) => parseInt(v.replace(')', ''), 10));
                return id && weight && !isNaN(id) && !isNaN(weight) ? { id, weight } : null;
            })
        )
        .filter((l) => !!l);

    // Remove duplicates by creating a Map with unique IDs
    const uniqueLocationsMap = new Map<number, (typeof locations)[number]>();
    locations.forEach((location) => {
        if (
            (uniqueLocationsMap.get(location.id)?.weight ?? Number.MIN_SAFE_INTEGER) <
            location.weight
        ) {
            uniqueLocationsMap.set(location.id, location);
        }
    });
    return Array.from(uniqueLocationsMap.values())
        .sort((a, b) => (b.weight !== a.weight ? b.weight - a.weight : a.id - b.id))
        .map((location) => location.id);
}
