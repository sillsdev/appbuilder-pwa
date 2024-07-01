import type { SearchResult } from './domain/entities';
import type {
    SearchPresenter,
    UserSearchRequest
} from './domain/interfaces/presentation-interfaces';
import { makeSearchConfig, makeSearchSession } from './factories';

const presenter: SearchPresenter = {
    onResults: function (results: SearchResult[]): void {
        const message = {
            type: 'results',
            value: results
        };
        self.postMessage(message);
    },

    onNewQuery: function (): void {
        const message = {
            type: 'newQuery',
            value: null
        };
        self.postMessage(message);
    }
};

const session = makeSearchSession(presenter);
const config = makeSearchConfig();

self.onmessage = function (e: MessageEvent<UserSearchRequest>) {
    const request = e.data;
    const options = config.configureOptions(request.options);
    session.submit(request.phrase, options);
};
