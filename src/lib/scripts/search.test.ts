import { readFileSync } from 'fs';
import { test, describe, expect } from 'vitest';

import { Search, type GraphQLResponse, type SearchResult } from './search';
import { SABProskomma } from '$lib/sab-proskomma';

class TestProskomma extends SABProskomma {
    searchResponse: GraphQLResponse;

    constructor(searchResponse: GraphQLResponse) {
        super();
        this.searchResponse = searchResponse;
    }

    async gqlQuery(query: string, callback?: (r: any) => void): Promise<any> {
        callback(this.searchResponse);
        return Promise.resolve(this.searchResponse);
    }
}

class TestSearch extends Search {
    constructor(
        phrase: string = '',
        matchWholeWords: boolean = false,
        docSet: string = '',
        collection: string = '',
        proskomma: SABProskomma = undefined,
        config: object = undefined
    ) {
        super(phrase, matchWholeWords, docSet, collection);
        this.pk = proskomma;
        this.config = config;
    }

    searchParams(keywords: string[]): string {
        return super.searchParams(keywords);
    }

    tokenize(input: string): string[] {
        return super.tokenize(input);
    }

    referenceFromScopes(scopes: string[]): string {
        return super.referenceFromScopes(scopes);
    }
}

describe('searchParams', () => {
    describe('whole words', () => {
        const search = new TestSearch('', true);

        test('one search word', () => {
            const result = search.searchParams(['Lazarus']);
            expect(result).toBe('withChars: ["Lazarus"]');
        });

        test('three search words', () => {
            const result = search.searchParams(['Lazarus', 'Mary', 'Martha']);
            expect(result).toBe('withChars: ["Lazarus", "Mary", "Martha"]');
        });

        test('quotation marks are escaped', () => {
            const result = search.searchParams(['"Lazarus"', 'Mary', 'Martha']);
            expect(result).toBe('withChars: ["\\"Lazarus\\"", "Mary", "Martha"]');
        });

        test('backslashes are escaped', () => {
            const result = search.searchParams(['"Lazarus"\\', 'Mary', 'Martha']);
            expect(result).toBe('withChars: ["\\"Lazarus\\"\\\\", "Mary", "Martha"]');
        });
    });

    describe('partial words', () => {
        const search = new TestSearch('', false);

        test('one search word', () => {
            const result = search.searchParams(['Laz']);
            expect(result).toBe('withMatchingChars: ["Laz.*"]');
        });

        test('three search words', () => {
            const result = search.searchParams(['Lazarus', 'Mary', 'Martha']);
            expect(result).toBe('withMatchingChars: ["Lazarus.*", "Mary.*", "Martha.*"]');
        });

        test('quotation marks are escaped', () => {
            const result = search.searchParams(['"Lazarus"', 'Mary', 'Martha']);
            expect(result).toBe('withMatchingChars: ["\\"Lazarus\\".*", "Mary.*", "Martha.*"]');
        });

        test('backslashes are escaped', () => {
            const result = search.searchParams(['Lazarus\\']);
            // 4 backslashes in the GraphQL query
            //   = 2 backslashes in the resulting regex
            //   = 1 literal backslash
            expect(result).toBe(String.raw`withMatchingChars: ["Lazarus\\\\.*"]`);
        });

        test('asterisks are escaped', () => {
            const result = search.searchParams(['Laz*', 'Mary', 'Martha']);
            expect(result).toBe('withMatchingChars: ["Laz\\\\*.*", "Mary.*", "Martha.*"]');
        });

        test('periods are escaped', () => {
            const result = search.searchParams(['Laz.']);
            expect(result).toBe('withMatchingChars: ["Laz\\\\..*"]');
        });

        test('question marks are escaped', () => {
            const result = search.searchParams(['Laz?']);
            expect(result).toBe('withMatchingChars: ["Laz\\\\?.*"]');
        });

        test('plus symbols are escaped', () => {
            const result = search.searchParams(['Laz+']);
            expect(result).toBe('withMatchingChars: ["Laz\\\\+.*"]');
        });

        test('square brakets are escaped', () => {
            const result = search.searchParams(['Laz[]']);
            expect(result).toBe('withMatchingChars: ["Laz\\\\[\\\\].*"]');
        });

        test('carats are escaped', () => {
            const result = search.searchParams(['Laz^']);
            expect(result).toBe('withMatchingChars: ["Laz\\\\^.*"]');
        });

        test('dollar signs are escaped', () => {
            const result = search.searchParams(['Laz$']);
            expect(result).toBe('withMatchingChars: ["Laz\\\\$.*"]');
        });

        test('curly brakets are escaped', () => {
            const result = search.searchParams(['Laz{}']);
            expect(result).toBe('withMatchingChars: ["Laz\\\\{\\\\}.*"]');
        });

        test('angle brakets are escaped', () => {
            const result = search.searchParams(['Laz<>']);
            expect(result).toBe('withMatchingChars: ["Laz\\\\<\\\\>.*"]');
        });

        test('exclamation points are escaped', () => {
            const result = search.searchParams(['Laz!']);
            expect(result).toBe('withMatchingChars: ["Laz\\\\!.*"]');
        });

        test('pipes are escaped', () => {
            const result = search.searchParams(['Laz|']);
            expect(result).toBe('withMatchingChars: ["Laz\\\\|.*"]');
        });

        test('hyphens are escaped', () => {
            const result = search.searchParams(['Laz-']);
            expect(result).toBe('withMatchingChars: ["Laz\\\\-.*"]');
        });
    });
});

describe('tokenize', () => {
    const search = new TestSearch();

    test('splits on whitespace', () => {
        expect(search.tokenize('  some\n thing\tgreat ')).toEqual(['some', 'thing', 'great']);
    });

    test('Retuns empty array if only whitespace', () => {
        expect(search.tokenize('  \n \t ')).toEqual([]);
    });
});

describe('referenceFromScopes', () => {
    const search = new TestSearch();

    test('chapter then verses', () => {
        const scopes = ['chapter/11', 'verses/1'];
        expect(search.referenceFromScopes(scopes)).toBe('11:1');
    });
});

describe('search results', () => {
    describe('Martha said', () => {
        const response = JSON.parse(
            readFileSync('test_data/sampleSearchResults/martha_said.json').toString()
        ) as GraphQLResponse;

        const results = JSON.parse(
            readFileSync('test_data/sampleSearchResults/martha_said_parsed.json').toString()
        ) as SearchResult[];

        const config = JSON.parse(
            readFileSync('test_data/sampleSearchResults/config.json').toString()
        );

        test('finds "Martha said"', async () => {
            const pk = new TestProskomma(response);
            const search = new TestSearch('Martha said', true, 'eng_C01', 'C01', pk, config);
            const searchResults = await search.makeQuery();
            expect(searchResults).toEqual(results);
        });

        test('ignores leading and trailing whitespace', async () => {
            const pk = new TestProskomma(response);
            const search = new TestSearch('  Martha said   ', true, 'eng_C01', 'C01', pk, config);
            const searchResults = await search.makeQuery();
            expect(searchResults).toEqual(results);
        });
    });

    describe('a shepherd', () => {
        const response = JSON.parse(
            readFileSync('test_data/sampleSearchResults/a_shepherd.json').toString()
        ) as GraphQLResponse;

        const results = JSON.parse(
            readFileSync('test_data/sampleSearchResults/a_shepherd_parsed.json').toString()
        ) as SearchResult[];

        const config = JSON.parse(
            readFileSync('test_data/sampleSearchResults/config.json').toString()
        );

        test('Results apppear in sorted order', async () => {
            const pk = new TestProskomma(response);
            const search = new TestSearch('a shepherd', true, 'eng_C01', 'C01', pk, config);
            const searchResults = await search.makeQuery();
            expect(searchResults).toEqual(results);
        });
    });

    test('Christmas carol', async () => {
        const response = JSON.parse(
            readFileSync('test_data/sampleSearchResults/manger.json').toString()
        ) as GraphQLResponse;

        const results = JSON.parse(
            readFileSync('test_data/sampleSearchResults/manger_parsed.json').toString()
        ) as SearchResult[];

        const config = JSON.parse(
            readFileSync('test_data/sampleSearchResults/config.json').toString()
        );

        const pk = new TestProskomma(response);
        const search = new TestSearch('manger', true, 'eng_C01', 'C01', pk, config);
        const searchResults = await search.makeQuery();
        expect(searchResults).toEqual(results);
    });

    test('post-procecessing respects whole words', async () => {
        const response = JSON.parse(
            readFileSync('test_data/sampleSearchResults/is_in.json').toString()
        ) as GraphQLResponse;

        const config = JSON.parse(
            readFileSync('test_data/sampleSearchResults/config.json').toString()
        );

        const pk = new TestProskomma(response);
        const search = new TestSearch('is in', true, 'eng_C01', 'C01', pk, config);
        const searchResults = await search.makeQuery();

        // Matthew 21:38 contains the phrase "his inheritance", which should not match
        // "is in" when searching whole words.
        const badResults = searchResults.filter(
            (r) =>
                r.reference.bookCode === 'MAT' &&
                r.reference.chapter === '21' &&
                r.reference.verses === '38'
        );
        expect(badResults.length).toBe(0);
    });
});
