import type {
    SearchWorkerRequest,
    SearchWorkerResponse
} from '../repositories/pk-search-worker-repository';

export interface SearchWorker {
    onResponse: (response: SearchWorkerResponse) => void;

    post(request: SearchWorkerRequest, transfer?: Transferable[]): void;
}
