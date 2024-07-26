import { refs } from '$lib/data/stores';
import { addHistory, type HistoryItem } from '$lib/data/history';
import { goto } from '$app/navigation';
import { base } from '$app/paths';
import { get } from 'svelte/store';
import { logScreenView } from '$lib/data/analytics';

function logHistoryItemAdded(itemAdded: HistoryItem) {
    logScreenView(itemAdded);
}

export function navigateToUrl(item: { collection: string; book: string; url: string }) {
    addHistory({ ...item, chapter: '' }, logHistoryItemAdded);
    goto(item.url);
}

export async function navigateToText(item: {
    docSet?: string;
    collection?: string;
    book: string;
    chapter: string;
    verse?: string;
}) {
    await refs.set({
        docSet: item.docSet,
        book: item.book,
        chapter: item.chapter,
        verse: item.verse
    });
    addHistory(
        { collection: item.collection, book: item.book, chapter: item.chapter, verse: item.verse },
        logHistoryItemAdded
    );
    goto(`${base}/text`);
}

export async function navigateToTextReference(reference: string) {
    await refs.setReference(reference);
    const nowRef: any = get(refs);
    goto(`${base}/text`);
    addHistory(
        {
            collection: nowRef.collection,
            book: nowRef.book,
            chapter: nowRef.chapter
        },
        logHistoryItemAdded
    );
}

export async function navigateToTextChapterInDirection(direction: number) {
    await refs.skip(direction);
    const nowRef: any = get(refs);
    addHistory(
        {
            collection: nowRef.collection,
            book: nowRef.book,
            chapter: nowRef.chapter
        },
        logHistoryItemAdded
    );
}
