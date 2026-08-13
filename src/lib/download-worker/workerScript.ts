let audioDownloadQueue: {
    docSet: string;
    collectionId: string;
    bookId: string;
    chapter: string;
}[] = [];
let processingAudioDownloads = false;
const messageWaiters = new Map(); //A map of resolve functions to run when the correct message is received

self.addEventListener('message', (event) => {
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
            self.postMessage({ type: 'DOWNLOAD_FINISHED', item: item });
        } else {
            self.postMessage({ type: 'DOWNLOAD_FAILED', item: item });
        }
    }
    processingAudioDownloads = false;
}
async function downloadItem(item: {
    docSet: string;
    collectionId: string;
    bookId: string;
    chapter: string;
}) {
    self.postMessage({ type: 'DOWNLOAD_AUDIO_ITEM', item: item });
    let messageContent: { type: string; success: boolean } = await waitForMessage(
        'FINISH_DOWNLOAD_AUDIO_ITEM'
    );
    return messageContent.success;
}

function waitForMessage(message: string): Promise<{ type: string; success: boolean }> {
    return new Promise((resolve) => {
        messageWaiters.set(message, resolve);
    });
}
