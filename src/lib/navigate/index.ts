import { goto } from '$app/navigation';
import { resolve } from '$app/paths';
import { logScreenView } from '$lib/data/analytics';
import { playStop } from '$lib/data/audio';
import { addHistory, type HistoryItem } from '$lib/data/history';
import { refs } from '$lib/data/stores';
import { get } from 'svelte/store';

function logHistoryItemAdded(itemAdded: HistoryItem) {
    logScreenView(itemAdded);
}

export function navigateToUrl(item: { collection: string; book: string; url: string }) {
    addHistory({ ...item, chapter: '' }, logHistoryItemAdded);
    // the url should have the full path??
    // eslint-disable-next-line svelte/no-navigation-without-resolve
    goto(item.url);
}

export async function navigateToText(item: {
    docSet: string;
    collection: string;
    book: string;
    chapter?: string;
    verse?: string;
}) {
    const { docSet, collection, book, chapter, verse } = item;
    if (chapter) {
        playStop();
        await refs.set({
            docSet,
            book,
            chapter,
            verse
        });
        addHistory({ collection, book, chapter, verse }, logHistoryItemAdded);
        goto(resolve(`/text`));
    }
}

export async function navigateToTextReference(reference: string) {
    playStop();
    await refs.setReference(reference);
    const nowRef: any = get(refs);
    goto(resolve(`/text`));
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
