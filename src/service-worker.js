/// <reference types="@sveltejs/kit" />
import { build, files, version } from '$service-worker';

// Create a unique cache name for this deployment
const CACHE = `cache-${version}`;

const ASSETS = [
    ...build, // the app itself
    ...files // everything in `static`
];

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
