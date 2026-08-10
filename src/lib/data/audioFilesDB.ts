import { scriptureConfig } from '$assets/config';
import type { BookCollectionAudioConfig } from '$config';
import { openDB, type DBSchema } from 'idb';
import {
    fileExistsInMusicDir,
    getAudioSubdirHandle,
    isFileSystemAccessSupported,
    writeAudioFile
} from './audioFileSystem';

export interface AudioItem {
    date: number;
    docSet: string;
    collection: string;
    book: string;
    chapter: string;
    // Present when the audio is stored in IndexedDB. Absent when stored on the
    // filesystem instead (see `filename`/`folder`).
    blob?: Blob;
    // Present when stored on the filesystem: the filename inside `folder`.
    filename?: string;
    // Present when stored on the filesystem: the AudioSource.folder subdirectory
    // (under the user-selected music directory) the file was written into.
    folder?: string;
}
interface AudioFiles extends DBSchema {
    audiofiles: {
        // [collection, book, chapter] identifies the one record kept per
        // chapter; docSet doesn't distinguish audio content (scriptureConfig
        // resolves audio by collection/book/chapter only), so it's stored on
        // the record but left out of the key.
        key: [string, string, string];
        value: AudioItem;
    };
}
// Origins that are known to require HTTPS even though the configured URL uses
// http://. Populated at runtime; kept in memory only (not persisted) so a
// fresh page load re-checks the environment rather than getting stuck on a
// stale determination, and so it never blocks a working MicroPi/offline
// server whose http:// URLs work directly.
const httpsPreferredOrigins = new Set<string>();

/**
 * Fetches a URL, transparently retrying over https:// if an http:// request
 * fails outright (e.g. a http->https redirect whose response lacks the CORS
 * headers needed for fetch() to follow it). Never inspects the redirect
 * response itself and never rewrites https:// URLs or URLs whose origin is
 * already known to work over plain http.
 */
export async function fetchWithProtocolFallback(url: string, init: RequestInit): Promise<Response> {
    let parsed: URL;
    try {
        parsed = new URL(url);
    } catch {
        return fetch(url, init);
    }
    if (parsed.protocol !== 'http:') {
        return fetch(url, init);
    }
    if (httpsPreferredOrigins.has(parsed.origin)) {
        parsed.protocol = 'https:';
        return fetch(parsed.toString(), init);
    }
    try {
        return await fetch(url, init);
    } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
            throw error;
        }
        const httpsUrl = new URL(url);
        httpsUrl.protocol = 'https:';
        const response = await fetch(httpsUrl.toString(), init);
        httpsPreferredOrigins.add(parsed.origin);
        return response;
    }
}

export function resetProtocolPreferences(): void {
    httpsPreferredOrigins.clear();
}

let audioDB: Awaited<ReturnType<typeof openDB<AudioFiles>>> | null = null;
async function openAudioFiles() {
    if (!audioDB) {
        audioDB = await openDB<AudioFiles>('audiofiles', 2, {
            async upgrade(db, oldVersion, newVersion, transaction) {
                if (oldVersion < 1) {
                    db.createObjectStore('audiofiles', {
                        keyPath: ['collection', 'book', 'chapter']
                    });
                    return;
                }
                // v1 keyed records by download date, so re-downloading a
                // chapter (e.g. after filesystem storage was enabled) added a
                // second record rather than replacing the first. Migrate the
                // existing records to a compound key, keeping only the
                // newest record per chapter so no downloaded audio is lost.
                const oldStore = transaction.objectStore('audiofiles');
                const existing = await oldStore.getAll();
                const newestByChapter = new Map<string, AudioItem>();
                for (const record of existing) {
                    const key = JSON.stringify([record.collection, record.book, record.chapter]);
                    const current = newestByChapter.get(key);
                    if (!current || record.date > current.date) {
                        newestByChapter.set(key, record);
                    }
                }
                db.deleteObjectStore('audiofiles');
                const newStore = db.createObjectStore('audiofiles', {
                    keyPath: ['collection', 'book', 'chapter']
                });
                await Promise.all(
                    Array.from(newestByChapter.values(), (record) => newStore.put(record))
                );
            }
        });
    }
    return audioDB;
}
export async function addAudioFile(
    item: {
        docSet: string;
        collection: string;
        book: string;
        chapter: string;
    },
    url: string,
    abortController: AbortController,
    onProgress?: (percent: number) => void,
    musicDirHandle?: FileSystemDirectoryHandle
): Promise<{ success: true; error?: never } | { success: false; error: string }> {
    try {
        const response = await fetchWithProtocolFallback(url, { signal: abortController.signal });
        if (!response.ok) {
            return { success: false, error: response.statusText };
        }
        const contentLength = response.headers.get('Content-Length');
        const total = contentLength ? parseInt(contentLength, 10) : 0;
        if (!response.body) {
            return { success: false, error: 'No Content' };
        }
        const reader = response.body.getReader();
        const chunks: BlobPart[] = [];
        let received = 0;

        while (true) {
            if (abortController.signal.aborted) {
                return { success: false, error: 'Download Cancelled' };
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
        const audioFiles = await openAudioFiles();
        const date = new Date().getTime();
        const book = scriptureConfig.bookCollections
            ?.find((x) => x.id === item.collection)
            ?.books.find((x) => x.id === item.book);
        if (book) {
            const chapterAudio = book.audio?.find((a) => item.chapter === '' + a.num);
            const folder = chapterAudio
                ? scriptureConfig.audio?.sources[chapterAudio.src]?.folder
                : undefined;
            console.debug('[audio-fs] addAudioFile: write check', {
                folder,
                filename: chapterAudio?.filename,
                hasHandle: !!musicDirHandle
            });
            if (folder && chapterAudio?.filename && musicDirHandle) {
                const subdirHandle = await getAudioSubdirHandle(musicDirHandle, folder, {
                    create: true
                });
                if (
                    subdirHandle &&
                    (await writeAudioFile(subdirHandle, chapterAudio.filename, blob))
                ) {
                    await audioFiles.put('audiofiles', {
                        ...item,
                        date,
                        filename: chapterAudio.filename,
                        folder
                    });
                    console.debug('[audio-fs] addAudioFile: wrote to filesystem', {
                        folder,
                        filename: chapterAudio.filename
                    });
                    return { success: true };
                }
                console.debug(
                    '[audio-fs] addAudioFile: filesystem write failed, falling back to blob'
                );
            }
            const nextItem = { ...item, date: date, blob: blob };
            await audioFiles.put('audiofiles', nextItem);
            return { success: true };
        }
        return {
            success: false,
            error: `Could not locate book ${item.collection}.${item.book} for downloaded audio.`
        };
    } catch (error) {
        console.error('Error downloading audio:', error);
        return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
}
export async function findAudioFile(item: { collection: string; book: string; chapter: string }) {
    const audioFiles = await openAudioFiles();
    return audioFiles.get('audiofiles', [item.collection, item.book, item.chapter]);
}

/**
 * Falls back to the filesystem when `findAudioFile` finds no record - the
 * record is lost whenever the user clears site data, even though a
 * previously-downloaded file written to their chosen music folder is
 * untouched by that. If the file is still there, re-creates the IndexedDB
 * record (so this probe only has to happen once per chapter) and returns it;
 * otherwise returns undefined so the caller prompts to download as usual.
 */
export async function recoverAudioFileFromDisk(
    item: { docSet: string; collection: string; book: string; chapter: string },
    chapterAudio: BookCollectionAudioConfig
): Promise<AudioItem | undefined> {
    if (!isFileSystemAccessSupported()) {
        return undefined;
    }
    const folder = scriptureConfig.audio?.sources[chapterAudio.src]?.folder;
    if (!folder) {
        return undefined;
    }
    if (!(await fileExistsInMusicDir(folder, chapterAudio.filename))) {
        return undefined;
    }
    const record: AudioItem = {
        ...item,
        date: new Date().getTime(),
        filename: chapterAudio.filename,
        folder
    };
    const audioFiles = await openAudioFiles();
    await audioFiles.put('audiofiles', record);
    return record;
}
