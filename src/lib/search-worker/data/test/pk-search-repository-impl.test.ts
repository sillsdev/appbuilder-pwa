import { SABProskomma } from '$lib/sab-proskomma';
import { describe, expect, test } from 'vitest';
import {
    GQLSearchHelpers,
    ProskommaSearchRepositoryImpl
} from '../repositories/pk-search-repository-impl';
import type { SearchOptions } from '$lib/search/domain/interfaces/data-interfaces';
import { ECDH } from 'crypto';

const sampleUsfm1 = `
\\id MAT 40-MAT-web.sfm World English Bible (WEB) 
\\ide UTF-8
\\h Matthew 
\\toc1 The Good News According to Matthew 
\\toc2 Matthew 
\\toc3 Mat 
\\mt2 The Good News According to 
\\mt1 Matthew 
\\c 1  
\\p
\\v 1 The book of the genealogy of Jesus Christ,\\f + \\fr 1:1  \\ft Messiah (Hebrew) and Christ (Greek) both mean “Anointed One”\\f* the son of David, the son of Abraham. 
\\v 2 Abraham became the father of Isaac. Isaac became the father of Jacob. Jacob became the father of Judah and his brothers. 
\\v 3 Judah became the father of Perez and Zerah by Tamar. Perez became the father of Hezron. Hezron became the father of Ram. 
\\v 4 Ram became the father of Amminadab. Amminadab became the father of Nahshon. Nahshon became the father of Salmon. 
\\v 5 $*.?+[]^&{}!<>|-
\\v 6 Lazarus
`;

const sampleUsfm2 = `
\\id MRK 40-MRK-web.sfm World English Bible (WEB) 
\\ide UTF-8
\\h Mark
\\toc1 The Good News According to Mark
\\toc2 Mark
\\toc3 Mrk
\\mt2 The Good News According to 
\\mt1 Mark
\\c 1  
\\p
\\v 1 Lazarus
`;

async function loadTestUSFM() {
    const pk = new SABProskomma();
    await addDocument(pk, sampleUsfm1);
    await addDocument(pk, sampleUsfm2);
    return pk;
}

async function addDocument(pk: SABProskomma, usfm: string) {
    await pk.gqlQuery(
        `mutation {
            addDocument(
                selectors: [
                    {key: "lang", value: "eng"}, 
                    {key: "abbr", value: "C01"}
                ], 
                contentType: "usfm", 
                content: """${usfm}""",
            )
        }`
    );
}

function testThaw(pk: SABProskomma, data: Uint8Array) {}

describe('keywordToRegex', () => {
    test('escapes Regex characters', () => {
        const phrase = '$*. \\ ?+[]^&{}!<>|-';
        const pattern = GQLSearchHelpers.keywordToRegex(phrase);

        // Resolve escaped quotes and backslashes the way GraphQL would.
        let parsed = '';
        let escape = false;
        for (const c of pattern) {
            if (escape) {
                if (c === '"') {
                    parsed += '"';
                } else if (c === '\\') {
                    parsed += '\\';
                } else {
                    throw new Error('Unknown escape sequence: \\' + c);
                }
                escape = false;
            } else if (c === '\\') {
                escape = true;
            } else {
                parsed += c;
            }
        }

        const regex = new RegExp(parsed);

        // Phrase should match literally.
        expect(phrase.match(regex)?.slice(), `Bad match from regex pattern '${parsed}'`).toEqual([
            phrase
        ]);
    });
});

describe('GQL Queries', async () => {
    const pk = await loadTestUSFM();
    const repo = new ProskommaSearchRepositoryImpl(pk, testThaw);

    test('queryBooks', async () => {
        const options: SearchOptions = { docSet: 'eng_C01', collection: 'C01' };
        const response = await repo.queryBooks('Lazarus', options);
        expect(response.length).toBe(2);
    });

    test('queryTokens', async () => {
        const options: SearchOptions = { docSet: 'eng_C01', collection: 'C01!' };
        const books = await repo.queryBooks('Lazarus', options);
        const tokens = await repo.queryTokens('Lazarus', books[0].id, options);
        expect(tokens.length).toBeGreaterThan(0);
    });

    describe('are case insensitive, whole words', async () => {
        const pk = await loadTestUSFM();

        const repo = new ProskommaSearchRepositoryImpl(pk, testThaw);

        const phrase = 'abrAHAm';
        const options: SearchOptions = {
            docSet: 'eng_C01',
            collection: 'C01',
            wholeWords: true
        };

        test('queryForBooks', async () => {
            const response = await repo.queryBooks(phrase, options);
            expect(response.length).toBeGreaterThan(0);
        });

        test('queryForBlocks', async () => {
            const books = await repo.queryBooks(phrase, options);
            const tokens = await repo.queryTokens(phrase, books[0].id, options);
            expect(tokens.length).toBeGreaterThan(0);
        });
    });

    describe('are case insensitive, partial words', async () => {
        const pk = await loadTestUSFM();

        const repo = new ProskommaSearchRepositoryImpl(pk, testThaw);

        const phrase = 'abrAHAm';
        const options: SearchOptions = {
            docSet: 'eng_C01',
            collection: 'C01',
            wholeWords: false
        };

        test('queryForBooks', async () => {
            const response = await repo.queryBooks(phrase, options);
            expect(response.length).toBeGreaterThan(0);
        });

        test('queryForBlocks', async () => {
            const books = await repo.queryBooks(phrase, options);
            const tokens = await repo.queryTokens(phrase, books[0].id, options);
            expect(tokens.length).toBeGreaterThan(0);
        });
    });
});

test('Escapes double quotes in search', async () => {
    const pk = await loadTestUSFM();

    const repo = new ProskommaSearchRepositoryImpl(pk, testThaw);

    const phrase = '"';
    const options: SearchOptions = {
        wholeWords: true,
        docSet: 'eng_C01',
        collection: 'C01'
    };

    // Shouldn't return any results, but should not throw an error.
    const results = await repo.queryBooks(phrase, options);
    expect(results.length).toBe(0);
});

test('Ignores punctuation', async () => {
    const pk = await loadTestUSFM();
    const repo = new ProskommaSearchRepositoryImpl(pk, testThaw);

    const phrase = 'David,';
    const options: SearchOptions = {
        wholeWords: false,
        docSet: 'eng_C01',
        collection: 'C01'
    };

    const results = await repo.queryBooks(phrase, options);
    expect(results.length).toBeGreaterThan(0);
});

test('Ignores case with partial words', async () => {
    const pk = await loadTestUSFM();
    const repo = new ProskommaSearchRepositoryImpl(pk, testThaw);

    const phrase = 'dAviD';
    const options = {
        wholeWords: false,
        docSet: 'eng_C01',
        collection: 'C01'
    };

    const results = await repo.queryBooks(phrase, options);
    expect(results.length).toBeGreaterThan(0);
});

test('Ignores case with whole words', async () => {
    const pk = await loadTestUSFM();
    const repo = new ProskommaSearchRepositoryImpl(pk, testThaw);

    const phrase = 'dAviD';
    const options = {
        wholeWords: true,
        docSet: 'eng_C01',
        collection: 'C01'
    };

    const results = await repo.queryBooks(phrase, options);
    expect(results.length).toBeGreaterThan(0);
});

test('Ignores case with substitutions and ignore', async () => {
    const pk = await loadTestUSFM();
    const repo = new ProskommaSearchRepositoryImpl(pk, testThaw);

    const phrase = 'dÁxiD';
    const options = {
        wholeWords: true,
        docSet: 'eng_C01',
        collection: 'C01',
        substitute: { a: 'á', á: 'a' },
        ignore: 'vx'
    };

    const results = await repo.queryBooks(phrase, options);
    expect(results.length).toBeGreaterThan(0);
});

describe('Ignores case by locale', async () => {
    const pk = await loadTestUSFM();
    const repo = new ProskommaSearchRepositoryImpl(pk, testThaw);

    test('whole words', async () => {
        const phrase = 'davİd';
        const options = {
            wholeWords: true,
            docSet: 'eng_C01',
            collection: 'C01',
            locale: 'tr'
        };

        const results = await repo.queryBooks(phrase, options);
        expect(results.length).toBeGreaterThan(0);
    });

    test('parial words', async () => {
        const phrase = 'davİ';
        const options = {
            wholeWords: false,
            docSet: 'eng_C01',
            collection: 'C01',
            locale: 'tr'
        };

        const results = await repo.queryBooks(phrase, options);
        expect(results.length).toBeGreaterThan(0);
    });
});

test('If word is not found, returns no results', async () => {
    const pk = await loadTestUSFM();
    const repo = new ProskommaSearchRepositoryImpl(pk, testThaw);

    const phrase = 'Hello';
    const options = {
        wholeWords: false,
        docSet: 'eng_C01',
        collection: 'C01'
    };

    const books = await repo.queryBooks(phrase, options);
    for (const book of books) {
        const results = await repo.queryTokens(phrase, book.id, options);
        expect(results.length).toBe(0);
    }
});

describe('Whole words', async () => {
    const pk = await loadTestUSFM();
    const repo = new ProskommaSearchRepositoryImpl(pk, testThaw);

    test('Matches whole word', async () => {
        const phrase = 'Abraham';
        const options = {
            wholeWords: true,
            docSet: 'eng_C01',
            collection: 'C01'
        };

        const allResults = [];

        const books = await repo.queryBooks(phrase, options);
        for (const book of books) {
            const results = await repo.queryTokens(phrase, book.id, options);
            allResults.push(...results);
        }
        expect(allResults.length).toBeGreaterThan(0);
    });

    test('Does not match partial word', async () => {
        const phrase = 'braham';
        const options = {
            wholeWords: true,
            docSet: 'eng_C01',
            collection: 'C01'
        };

        const books = await repo.queryBooks(phrase, options);
        for (const book of books) {
            const results = await repo.queryTokens(phrase, book.id, options);
            expect(results.length).toBe(0);
        }
    });
});

test('Ignore characters', async () => {
    const pk = await loadTestUSFM();
    const repo = new ProskommaSearchRepositoryImpl(pk, testThaw);

    const phrase = 'Heron';
    const options = {
        wholeWords: false,
        ignore: 'z',
        docSet: 'eng_C01',
        collection: 'C01'
    };

    const allResults = [];

    const books = await repo.queryBooks(phrase, options);
    for (const book of books) {
        const results = await repo.queryTokens(phrase, book.id, options);
        allResults.push(...results);
    }
    expect(allResults.length).toBeGreaterThan(0);
});

test('Equivalent characters', async () => {
    const pk = await loadTestUSFM();
    const repo = new ProskommaSearchRepositoryImpl(pk, testThaw);

    const phrase = 'Jesús';
    const options = {
        wholeWords: false,
        substitute: { u: 'ú', ú: 'u' },
        docSet: 'eng_C01',
        collection: 'C01'
    };

    const allResults = [];

    const books = await repo.queryBooks(phrase, options);
    for (const book of books) {
        const results = await repo.queryTokens(phrase, book.id, options);
        allResults.push(...results);
    }
    expect(allResults.length).toBeGreaterThan(0);
});

test('loadDocSet loads correct data', () => {
    let loadedData: Uint8Array;

    const thaw = (pk: SABProskomma, data: Uint8Array) => {
        loadedData = data;
    };

    const repo = new ProskommaSearchRepositoryImpl(new SABProskomma(), thaw);

    const encoder = new TextEncoder();
    const data = encoder.encode('abc');
    repo.loadDocSet(data);

    const decoder = new TextDecoder('utf-8');
    expect(decoder.decode(loadedData)).toBe(decoder.decode(data));
});
