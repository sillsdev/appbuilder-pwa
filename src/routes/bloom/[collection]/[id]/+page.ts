import { scriptureConfig } from '$assets/config';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params }) => {
    const id = params.id;
    const collection = params.collection;

    const bookCollection = scriptureConfig.bookCollections?.find((x) => x.id === collection);
    const book = bookCollection?.books.find((x) => x.id === id && x.type === 'bloom-player');

    return {
        id: id,
        book: book,
        bookCollection: bookCollection,
        collection: collection,
        lang: bookCollection.languageCode
    };
};
