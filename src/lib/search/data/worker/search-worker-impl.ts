import type { SearchWorker } from '../interfaces/search-worker';
import type {
    SearchWorkerResponse,
    SearchWorkerRequest
} from '../repositories/pk-search-worker-repository';

export class SearchWorkerImpl implements SearchWorker {
    constructor() {
        this.worker = new Worker(new URL('./worker-script.ts', import.meta.url), {
            type: 'module'
        });
        this.worker.onmessage = (e: MessageEvent<SearchWorkerResponse>) => this.onResponse(e.data);
    }

    worker: Worker;

    onResponse: (response: SearchWorkerResponse) => void;

    post(request: SearchWorkerRequest, transfer: Transferable[]): void {
        this.worker.postMessage(request, transfer);
    }
}
