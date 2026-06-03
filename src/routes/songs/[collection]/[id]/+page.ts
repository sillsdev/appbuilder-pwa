import config from '$assets/config';
import type { ScriptureConfig } from '$config';
import type { PageLoad } from './$types';

const songs: Record<string, string> = import.meta.glob('./*.txt', {
    import: 'default',
    eager: true,
    base: '/src/gen-assets/songs',
    query: '?url'
});

export const load: PageLoad = async ({ params, fetch }) => {
    const id = params.id;
    const collection = params.collection;

    const scriptConfig = config as ScriptureConfig;

    const bookCollection = scriptConfig.bookCollections?.find((x) => x.id === collection);
    const book = bookCollection?.books.find((x) => x.id === id);

    let titleData = '';
    let numberData = '';
    try {
        const titleKey = `./${collection}-${id}-songs-by-title.txt`;
        const titleUrl = songs[titleKey];
        if (!titleUrl) {
            throw new Error(`Song text asset not found for key ${titleKey}`);
        }
        const titleResponse = await fetch(titleUrl);
        if (!titleResponse.ok) {
            throw new Error('Failed to fetch song text file');
        }

        titleData = await titleResponse.text();

        const numberKey = `./${collection}-${id}-songs-by-number.txt`;
        const numberUrl = songs[numberKey];
        if (!numberUrl) {
            throw new Error(`Song text asset not found for key ${numberKey}`);
        }
        const numberResponse = await fetch(numberUrl);
        if (!numberResponse.ok) {
            throw new Error('Failed to fetch song text file');
        }

        numberData = await numberResponse.text();
    } catch (error) {
        console.error('Error fetching song text file:', error);
    }

    return {
        titleData: titleData,
        numberData: numberData,
        collection: params.collection,
        songId: id,
        displayLabel: book?.name || 'Song'
    };
};
