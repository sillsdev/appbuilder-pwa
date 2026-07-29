import { scriptureConfig } from '$assets/config';
import { openDB, type DBSchema } from 'idb';

export interface AudioItem {
    date: number;
    docSet: string;
    collection: string;
    book: string;
    chapter: string;
    blob: Blob;
}
interface AudioClips extends DBSchema {
    audioclips: {
        key: number;
        value: AudioItem;
        indexes: {
            'collection, book, chapter': string[];
            date: string;
        };
    };
}
let audioDB: Awaited<ReturnType<typeof openDB<AudioClips>>> | null = null;
async function openAudioClips() {
    if (!audioDB) {
        audioDB = await openDB<AudioClips>('audioclips', 1, {
            upgrade(db) {
                const audioStore = db.createObjectStore('audioclips', {
                    keyPath: 'date'
                });
                audioStore.createIndex('collection, book, chapter', [
                    'collection',
                    'book',
                    'chapter'
                ]);
                audioStore.createIndex('date', ['date']);
            }
        });
    }
    return audioDB;
}
export async function addAudioClip(
    item: {
        docSet: string;
        collection: string;
        book: string;
        chapter: string;
    },
    url: string,
    abortController: AbortController,
    onProgress?: (percent: number) => void
) {
    try {
        const response = await fetch(url, { signal: abortController.signal });
        if (!response.ok) {
            return false;
        }
        const contentLength = response.headers.get('Content-Length');
        const total = contentLength ? parseInt(contentLength, 10) : 0;
        if (!response.body) {
            return false;
        }
        const reader = response.body.getReader();
        const chunks: BlobPart[] = [];
        let received = 0;

        while (true) {
            if (abortController.signal.aborted) {
                return false;
            }
            const { done, value } = await reader.read();
            if (done) {
                break;
            }

            chunks.push(value);

            received += value.length;

            if (total && onProgress) {
                const percent = Math.round((received / total) * 100);
                onProgress(percent);
            }
        }

        const blob = new Blob(chunks);
        const audioClips = await openAudioClips();
        const date = new Date().getTime();
        const bookIndex = scriptureConfig.bookCollections
            ?.find((x) => x.id === item.collection)
            ?.books.findIndex((x) => x.id === item.book);
        if (bookIndex !== undefined && bookIndex >= 0) {
            const nextItem = { ...item, date: date, blob: blob };
            await audioClips.add('audioclips', nextItem);
            return true;
        }
        return false;
    } catch (error) {
        console.error('Error downloading audio:', error);
        return false;
    }
}
export async function findAudioClip(item: { collection: string; book: string; chapter: string }) {
    const audioClips = await openAudioClips();
    const tx = audioClips.transaction('audioclips', 'readonly');
    const index = tx.store.index('collection, book, chapter');
    const result = await index.getAll([item.collection, item.book, item.chapter]);
    await tx.done;
    return result[0];
}
