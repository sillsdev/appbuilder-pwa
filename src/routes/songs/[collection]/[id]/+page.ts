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
    } catch (error) {
        console.error('Error fetching song title text file:', error);
    }

    try {
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
        console.error('Error fetching song number text file:', error);
    }

    return {
        songsByTitle: titleData
            .split(/\r?\n/)
            .map((line) => line.split('\t'))
            .filter((parts) => parts.length === 2)
            .map((parts) => ({ number: parts[0], title: parts[1] })),
        songsByNumber: numberData
            .split(/\r?\n/)
            .map((line) => line.split('\t'))
            .filter((parts) => parts.length === 2)
            .map((parts) => ({ number: parts[0], title: parts[1] }))
    };
};
