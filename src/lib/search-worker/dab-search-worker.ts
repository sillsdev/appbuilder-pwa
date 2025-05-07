import { initializeDatabase } from '$lib/data/stores/lexicon';
import type { SearchOptions } from '$lib/search/domain/interfaces/data-interfaces';

// Search the dictionary based on the phrase and options
export async function searchDictionary(phrase: string, options: SearchOptions) {
    const searchWords = phrase.split(' ');

    const column = options.accentsAndTones ? 'word' : 'word_no_accents';

    let db = await initializeDatabase({ fetch });
    let results;
    const dynamicQuery = searchWords.map(() => `${column} LIKE ?`).join(' OR ');
    const dynamicParams = searchWords.map((word) => (options.wholeWords ? word : `%${word}%`));
    results = db.exec(`SELECT locations FROM search_words WHERE ${dynamicQuery}`, dynamicParams);
    console.log('results:', results);

    if (!results?.length || !results[0]?.values?.length) {
        return [];
    }

    // Extract and process locations from the query result
    let locations = results[0].values.flatMap((value) =>
        value[0].split(' ').map((loc) => {
            const [id, weight] = loc.split('(').map((v) => v.replace(')', ''));
            return { id: parseInt(id, 10), weight: parseInt(weight, 10) };
        })
    );

    // Remove duplicates by creating a Map with unique IDs
    const uniqueLocationsMap = new Map();
    locations.forEach((location) => {
        if (
            !uniqueLocationsMap.has(location.id) ||
            uniqueLocationsMap.get(location.id).weight < location.weight
        ) {
            uniqueLocationsMap.set(location.id, location);
        }
    });
    locations = Array.from(uniqueLocationsMap.values());

    locations = locations.sort((a, b) => b.weight - a.weight);
    const ids = locations.map((location) => location.id);
    return ids;
}
