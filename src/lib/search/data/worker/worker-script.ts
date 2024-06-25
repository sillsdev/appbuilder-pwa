import { SABProskomma } from '$lib/sab-proskomma';
import { thaw } from '$lib/scripts/thaw';
import { ProskommaSearchRepositoryImpl } from '../repositories/pk-search-repository-impl';
import type {
    SearchWorkerResponse,
    BookQuery,
    TokenQuery,
    SearchWorkerRequest
} from '../repositories/pk-search-worker-repository';

const pk = new SABProskomma();
const repo = new ProskommaSearchRepositoryImpl(pk);

self.onmessage = function (e: MessageEvent<SearchWorkerRequest>) {
    if (e.data.type === 'load') {
        onLoadRequest(e.data);
    } else if (e.data.type === 'book-query') {
        onBookRequest(e.data);
    } else if (e.data.type === 'token-query') {
        onTokenRequest(e.data);
    }
};

function onLoadRequest(request: SearchWorkerRequest) {
    thaw(pk, request.data as Uint8Array);

    const message: SearchWorkerResponse = {
        requestId: request.id,
        type: 'load-complete'
    };
    self.postMessage(message);
}

async function onBookRequest(request: SearchWorkerRequest) {
    const query = request.data as BookQuery;
    const books = await repo.queryBooks(query.phrase, query.options);
    const response: SearchWorkerResponse = {
        requestId: request.id,
        type: 'books',
        data: books
    };
    // const serial = serialize(response);
    // self.postMessage(serial, [serial]);
    self.postMessage(response);
    console.log('returned books');
}

async function onTokenRequest(request: SearchWorkerRequest) {
    const query = request.data as TokenQuery;
    const tokens = await repo.queryTokens(query.phrase, query.bookId, query.options);

    const response: SearchWorkerResponse = {
        requestId: request.id,
        type: 'tokens',
        data: tokens
    };
    // const serial = serialize(response);
    // self.postMessage(serial, [serial]);
    self.postMessage(response);
    console.log('got tokens');
}
