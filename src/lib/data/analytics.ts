import { analytics } from '$lib/data/stores';
import config from '$lib/data/config';
import type { HistoryItem } from './history';

function getBook(item: { collection?: string; book: string }) {
    return config.bookCollections
        .find((x) => x.id === item.collection)
        .books.find((x) => x.id === item.book);
}

function getDamId(item: { book: any; chapter: string }) {
    let damId;
    if (item.book.audio.length > 0) {
        const audio = item.book.audio.find((x) => x.num === Number(item.chapter));
        const source = audio.src;
        if (source) {
            if (config.audio.sources[source]?.type === 'fcbh') {
                damId = config.audio.sources[source].damId;
            }
        }
    }
    return damId;
}

export function logScreenView(item: HistoryItem) {
    const book = getBook({ ...item });
    const chapter = item.chapter;
    const bookAbbrev = book.abbreviation;
    const damId = getDamId({ book, chapter });
    const params = {
        screenName: item.book,
        bookCol: item.collection,
        bookId: item.book,
        bookAbbrev,
        chapter,
        damId
    };
    analytics.log('ab_screen_view', params);
}
