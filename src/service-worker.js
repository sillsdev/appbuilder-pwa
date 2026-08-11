/// <reference types="@sveltejs/kit" />
import { build, files, version } from '$service-worker';

// Create a unique cache name for this deployment
const CACHE = `cache-${version}`;

const ASSETS = [
    ...build, // the app itself
    ...files // everything in `static`
];
let audioDownloadQueue = [];
let processingAudioDownloads = false;

self.addEventListener('install', (event) => {
    // Create a new cache and add all files to it
    async function addFilesToCache() {
        console.log('[SW] Installing...');
        const cache = await caches.open(CACHE);
        // Cache each URL individually so one failure doesn't abort SW install
        await Promise.all(
            ASSETS.map((url) =>
                cache.add(url).catch((err) => {
                    console.warn('[SW] Could not cache:', url, err);
                })
            )
        );
        // Activate immediately rather than waiting for old SW to be replaced
        self.skipWaiting();
    }

    event.waitUntil(addFilesToCache());
});

self.addEventListener('activate', (event) => {
    // Remove previous cached data from disk
    async function deleteOldCaches() {
        console.log('[SW] Activating...');
        const cachePath = CACHE.split(';')[2];
        for (const key of await caches.keys()) {
            const keyPath = key.split(';')[2];
            /**
             * we want to delete the cache if it is missing the path (backwards-compatible), or if its path is the same as the current app (the fix)
             */
            if (key !== CACHE && (!keyPath || keyPath === cachePath)) {
                console.log(`[SW] Deleting old cache: ${key}`);
                await caches.delete(key);
            }
        }
        // Take control of all pages in scope immediately
        await self.clients.claim();
    }

    event.waitUntil(deleteOldCaches());
});

self.addEventListener('fetch', (event) => {
    // ignore POST requests etc
    if (event.request.method !== 'GET') {
        return;
    }

    async function respond() {
        const url = new URL(event.request.url);
        const cache = await caches.open(CACHE);

        const cachedResponse = await cache.match(event.request);

        // `build`/`files` can always be served from the cache (unless items are evicted under cache pressure...)
        if (cachedResponse && ASSETS.includes(url.pathname)) {
            return cachedResponse;
        }

        let online = true;

        // for everything else, try the network first, but
        // fall back to the cache if we're offline
        try {
            const response = await fetch(event.request);

            if (response.status === 200) {
                cache.put(event.request, response.clone());
            }

            return response;
        } catch {
            online = false;
            return cachedResponse;
        } finally {
            const client = await self.clients.get(event.clientId);
            client?.postMessage({ online });
        }
    }

    event.respondWith(respond());
});

const messageWaiters = new Map(); //A map of resolve functions to run when the correct message is received

self.addEventListener('message', async (event) => {
    if (event.data?.type === 'START_DOWNLOAD') {
        const { collectionId, bookId, chapter, docSet } = event.data;
        audioDownloadQueue.push({
            docSet,
            collectionId,
            bookId,
            chapter
        });
        processAudioQueue();
    } else if (event.data?.type) {
        const resolve = messageWaiters.get(event.data.type);
        if (resolve) {
            messageWaiters.delete(event.data.type);
            resolve(event.data);
        }
    }
});
async function processAudioQueue() {
    if (processingAudioDownloads) {
        return;
    }
    processingAudioDownloads = true;
    while (audioDownloadQueue.length > 0) {
        const item = audioDownloadQueue[0];
        const success = await downloadItem(item);
        audioDownloadQueue.shift();
        if (success) {
            self.clients.matchAll().then((clients) => {
                clients.forEach((client) =>
                    client.postMessage({ type: 'DOWNLOAD_FINISHED', item: item })
                );
            });
        } else {
            self.clients.matchAll().then((clients) => {
                clients.forEach((client) =>
                    client.postMessage({ type: 'DOWNLOAD_FAILED', item: item })
                );
            });
        }
    }
    processingAudioDownloads = false;
}
async function downloadItem(item) {
    self.clients.matchAll().then((clients) => {
        clients.forEach((client) =>
            client.postMessage({ type: 'DOWNLOAD_AUDIO_ITEM', item: item })
        );
    });
    let messageContent = await waitForMessage('FINISH_DOWNLOAD_AUDIO_ITEM');
    return messageContent.success;
}

function waitForMessage(message) {
    return new Promise((resolve) => {
        messageWaiters.set(message, resolve);
    });
}
