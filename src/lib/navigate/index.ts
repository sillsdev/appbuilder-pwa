import { goto } from '$app/navigation';
import { base } from '$app/paths';
import { logScreenView } from '$lib/data/analytics';
import { playStop } from '$lib/data/audio';
import { addHistory, type HistoryItem } from '$lib/data/history';
import { refs } from '$lib/data/stores';
import { get } from 'svelte/store';

export function getRoute(route: string) {
    return `${base}/#${route}`;
}

function logHistoryItemAdded(itemAdded: HistoryItem) {
    logScreenView(itemAdded);
}

export function navigateToUrl(item: { collection: string; book: string; url: string }) {
    addHistory({ ...item, chapter: '' }, logHistoryItemAdded);
    goto(getRoute(item.url));
}

export async function navigateToText(item: {
    docSet?: string;
    collection?: string;
    book: string;
    chapter: string;
    verse?: string;
}) {
    playStop();
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
    goto(getRoute('/text'));
}

export async function navigateToTextReference(reference: string) {
    playStop();
    await refs.setReference(reference);
    const nowRef: any = get(refs);
    goto(getRoute('/text'));
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
    playStop();
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
