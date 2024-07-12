import { ConfigRepository } from '$lib/search/data/repositories/config-repository';
import { describe, expect, test } from 'vitest';
import type { SearchResult } from '../entities';
import type {
    SearchOptions,
    SearchStorageData,
    SearchStorageRepository
} from '../interfaces/data-interfaces';
import type {
    SearchConfigManager,
    SearchQueryManager,
    SearchResultOptions
} from '../interfaces/domain-interfaces';
import type { SearchPresenter, UserSearchOptions } from '../interfaces/presentation-interfaces';
import { SearchSession } from '../search-session';
import { relative } from 'path';

class TestPresenter implements SearchPresenter {
    phrase: string;
    options: UserSearchOptions;
    results: SearchResult[] = [];

    newQueryCalled = false;
    queryDoneCalled = false;

    setOptions(phrase: string, options: UserSearchOptions): void {
        this.phrase = phrase;
        this.options = options;
    }

    onResults(results: SearchResult[]): void {
        this.results.push(...results);
    }

    onNewQuery(): void {
        this.newQueryCalled = true;
    }

    onQueryDone(): void {
        this.queryDoneCalled = true;
    }
}

interface TestConfigValues {
    searchAccentsDefault?: boolean;
    searchWholeWordsDefault?: boolean;
}

class TestConfig extends ConfigRepository {
    constructor({ searchAccentsDefault, searchWholeWordsDefault }: TestConfigValues = {}) {
        super();
        this.searchAccentsDefault = () => searchAccentsDefault;
        this.searchWholeWordsDefault = () => searchWholeWordsDefault;
    }
}

function testConfigManager(): SearchConfigManager {
    return (_) => ({ docSet: '', collection: '' });
}

class TestQueryManager implements SearchQueryManager {
    constructor(returnResults: SearchResult[]) {
        this.results = returnResults;
    }

    results: SearchResult[];

    onResults: (results: SearchResult[]) => void;
    onNewQuery: () => void;

    setOnNewQuery(callback: () => void): void {
        this.onNewQuery = callback;
    }

    setOnResults(callback: (results: SearchResult[]) => void): void {
        this.onResults = callback;
    }

    async submit(
        phrase: string,
        options: SearchOptions,
        resultOptions: SearchResultOptions
    ): Promise<void> {
        await new Promise((resolve) => setTimeout(resolve, 10));
        this.onNewQuery();
        for (const result of this.results) {
            this.onResults([result]);
        }
    }
}

class TestStorage implements SearchStorageRepository {
    constructor(savedData: SearchStorageData) {
        this.savedData = savedData;
    }

    savedData: SearchStorageData;

    async save(data: SearchStorageData): Promise<void> {
        this.savedData = data;
    }

    async read(): Promise<SearchStorageData> {
        return this.savedData;
    }
}

interface TestObjects {
    presenter: TestPresenter;
    config: TestConfig;
    configureOptions: SearchConfigManager;
    queryManager: TestQueryManager;
    storage: TestStorage;
    session: SearchSession;
}

interface TestOptions {
    searchAccentsDefault?: boolean;
    searchWholeWordsDefault?: boolean;
    savedData?: SearchStorageData;
    queryResults?: SearchResult[];
}

function testObjects({
    searchAccentsDefault,
    searchWholeWordsDefault,
    savedData,
    queryResults
}: TestOptions = {}): TestObjects {
    const presenter = new TestPresenter();
    const config = new TestConfig({ searchAccentsDefault, searchWholeWordsDefault });
    const configureOptions = testConfigManager();
    const queryManager = new TestQueryManager(queryResults ?? []);
    const storage = new TestStorage(savedData);
    const session = new SearchSession({
        presenter,
        config,
        configureOptions,
        queryManager,
        storage
    });
    return {
        presenter,
        config,
        configureOptions,
        queryManager,
        storage,
        session
    };
}

describe('initializes user options', () => {
    test('phrase defaults to empty string', () => {
        const objects = testObjects();
        expect(objects.presenter.phrase).toBe('');
    });

    test('whole words', () => {
        for (const expectedValue of [true, false]) {
            const objects = testObjects({ searchWholeWordsDefault: expectedValue });
            expect(objects.presenter.options.wholeWords).toBe(expectedValue);
        }
    });

    test('match accents', () => {
        for (const expectedValue of [true, false]) {
            const objects = testObjects({ searchAccentsDefault: expectedValue });
            expect(objects.presenter.options.matchAccents).toBe(expectedValue);
        }
    });
});

describe('loadLastQuery', () => {
    test('loads phrase', async () => {
        const savedData: SearchStorageData = {
            phrase: 'hello',
            options: {
                collection: '',
                wholeWords: false,
                matchAccents: false
            },
            results: []
        };
        const objects = testObjects({ savedData });
        await objects.session.loadLastQuery();
        expect(objects.presenter.phrase).toBe('hello');
    });

    test('loads options', async () => {
        for (const boolValue of [true, false]) {
            const userOptions: UserSearchOptions = {
                collection: 'eng_test',
                wholeWords: boolValue,
                matchAccents: !boolValue
            };
            const savedData: SearchStorageData = {
                phrase: '',
                options: userOptions,
                results: []
            };
            const objects = testObjects({ savedData });
            await objects.session.loadLastQuery();
            expect(objects.presenter.options).toEqual(userOptions);
        }
    });

    test('loads saved results', async () => {
        const savedData: SearchStorageData = {
            phrase: '',
            options: undefined,
            results: [
                {
                    reference: undefined,
                    chunks: []
                },
                {
                    reference: undefined,
                    chunks: []
                }
            ]
        };
        const objects = testObjects({ savedData });
        await objects.session.loadLastQuery();
        expect(objects.presenter.results.length).toEqual(2);
    });

    describe('no saved results', () => {
        test('does not set options', async () => {
            const userOptions: UserSearchOptions = {
                collection: 'eng_test',
                wholeWords: false,
                matchAccents: true
            };
            const objects = testObjects();
            objects.presenter.options = userOptions;
            await objects.session.loadLastQuery();
            expect(objects.presenter.options).toEqual(userOptions);
        });

        test('does not set results', async () => {
            const results: SearchResult[] = [
                {
                    reference: undefined,
                    chunks: []
                }
            ];
            const objects = testObjects();
            objects.presenter.results = results;
            await objects.session.loadLastQuery();
            expect(objects.presenter.results).toEqual(results);
        });
    });
});

describe('submit', () => {
    const options: UserSearchOptions = {
        collection: 'eng_test',
        wholeWords: false,
        matchAccents: false
    };

    test('returns results to presenter', async () => {
        const results: SearchResult[] = [
            {
                reference: undefined,
                chunks: []
            },
            {
                reference: undefined,
                chunks: []
            }
        ];
        const objects = testObjects({ queryResults: results });
        await objects.session.submit('', options);
        expect(objects.presenter.results).toEqual(results);
    });

    test('saves search query', async () => {
        const results: SearchResult[] = [
            {
                reference: undefined,
                chunks: []
            },
            {
                reference: undefined,
                chunks: []
            }
        ];
        const queryData: SearchStorageData = {
            phrase: 'world',
            options,
            results
        };
        const objects = testObjects({ queryResults: results });
        await objects.session.submit('world', options);
        expect(objects.storage.savedData).toEqual(queryData);
    });

    test('saves second search query', async () => {
        const results: SearchResult[] = [
            {
                reference: undefined,
                chunks: []
            },
            {
                reference: undefined,
                chunks: []
            }
        ];
        const queryData: SearchStorageData = {
            phrase: 'world',
            options,
            results
        };
        const objects = testObjects({ queryResults: results });
        await objects.session.submit('world', options);
        await objects.session.submit('world', options);
        expect(objects.storage.savedData).toEqual(queryData);
    });

    test('calls queryDone', async () => {
        const objects = testObjects();
        await objects.session.submit('', options);
        expect(objects.presenter.queryDoneCalled).toBe(true);
    });
});
