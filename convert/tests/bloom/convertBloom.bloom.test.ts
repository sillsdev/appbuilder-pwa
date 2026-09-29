import { existsSync, readdirSync, readFileSync } from 'fs';
import path from 'path';
import { beforeAll, describe, expect, test } from 'vitest';
import { parseBookCollections, parseColorThemes, parseFonts } from '../../convertConfig';
import { getDirHash } from '../../fileUtils';
import { getLangTagLookup } from '../../langtags';
import { dataDir, getBloomBooks, isBloomProjectLoaded, loadAppDef } from './bloomTestUtils';

type BookCollections = ReturnType<typeof parseBookCollections>;

const REF_REGEXES: RegExp[] = [
    /\b(?:src|href|data-backgroundaudio)\s*=\s*(["'])([^"']*)\1/gi,
    /url\(\s*(["']?)([^"')]*)\1/gi
];

function walkFiles(dir: string): string[] {
    return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
        const entryPath = path.join(dir, entry.name);
        return entry.isDirectory() ? walkFiles(entryPath) : [entryPath];
    });
}

function walkNames(dir: string): string[] {
    return readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
        entry.isDirectory() ? [entry.name, ...walkNames(path.join(dir, entry.name))] : [entry.name]
    );
}

function extractRefs(content: string): string[] {
    return REF_REGEXES.flatMap((regex) => Array.from(content.matchAll(regex), (m) => m[2]));
}

function isLocalRef(ref: string): boolean {
    return ref !== '' && !/^(?:[a-z][a-z0-9+.-]*:|#|\/)/i.test(ref);
}

function safeDecode(value: string): string {
    try {
        return decodeURIComponent(value);
    } catch {
        return value;
    }
}

function readCatalog(collection: BookCollections[number]) {
    const catalogPath = path.join(
        'src',
        'gen-assets',
        'collections',
        'catalog',
        `${collection.languageCode}_${collection.id}.json`
    );
    expect(existsSync(catalogPath)).toBe(true);
    return JSON.parse(readFileSync(catalogPath, 'utf-8'));
}

function refToPath(ref: string): string {
    return safeDecode(ref.split(/[?#]/)[0]);
}

describe.skipIf(!isBloomProjectLoaded())('bloom project conversion', () => {
    const books = getBloomBooks();
    const document = loadAppDef()!;
    const collectionsDir = path.join('static', 'collections');

    let collections: BookCollections;
    let offlineCollections: BookCollections;

    beforeAll(async () => {
        parseFonts(document, 0);
        collections = parseBookCollections(document, dataDir, 0, await getLangTagLookup(0));
        offlineCollections = parseBookCollections(document, dataDir, 0, new Map());
    });

    function findBook(source: BookCollections, collectionId: string, bookId: string) {
        const collection = source.find((c) => c.id === collectionId)!;
        const book = collection.books.find((b) => b.id === bookId)!;
        return { collection, book };
    }

    function outputDir(collectionId: string, bookId: string): string {
        const { book } = findBook(collections, collectionId, bookId);
        return path.join(collectionsDir, collectionId, book.hashedDir ?? bookId);
    }

    function markupFiles(collectionId: string, bookId: string): string[] {
        return walkFiles(outputDir(collectionId, bookId)).filter((f) =>
            ['.htm', '.html', '.css'].includes(path.extname(f).toLowerCase())
        );
    }

    test('bloom player is copied to static', () => {
        expect(existsSync(path.join('static', 'bloom-player', 'bloom-player'))).toBe(true);
    });

    test.each(books)('book $collectionId/$bookId has source data', ({ collectionId, bookId }) => {
        expect(existsSync(path.join(dataDir, 'books', collectionId, bookId))).toBe(true);
    });

    describe('Bloom Books config', () => {
        test.each(books)(
            'book $collectionId/$bookId hashedDir matches source hash and output folder',
            ({ collectionId, bookId }) => {
                const { book } = findBook(collections, collectionId, bookId);
                const hash = getDirHash(path.join(dataDir, 'books', collectionId, bookId));
                expect(book.hashedDir).toBe(`${bookId}.${hash}`);
                expect(existsSync(path.join(collectionsDir, collectionId, book.hashedDir!))).toBe(
                    true
                );
            }
        );

        test.each(books)(
            'book $collectionId/$bookId entry file exists',
            ({ collectionId, bookId }) => {
                const { book } = findBook(collections, collectionId, bookId);
                expect(book.file).toBeTruthy();
                expect(
                    existsSync(
                        path.join(outputDir(collectionId, bookId), book.file.normalize('NFC'))
                    )
                ).toBe(true);
            }
        );

        test.each(books)(
            'book $collectionId/$bookId bloomMeta has languages and titles',
            ({ collectionId, bookId }) => {
                const { book } = findBook(collections, collectionId, bookId);
                const { languages, titles } = book.bloomMeta!;
                expect(languages).not.toHaveLength(0);
                expect(titles).not.toHaveLength(0);
                for (const l of languages!) {
                    expect(l.lang).toBeTruthy();
                    expect(l.name).toBeTruthy();
                }
                for (const t of titles!) {
                    expect(t.lang).toBeTruthy();
                    expect(t.name).toBe(t.name.trim());
                }
            }
        );

        test.each(books)(
            'book $collectionId/$bookId resolvedLang is a book language or the collection language',
            ({ collectionId, bookId }) => {
                const { collection, book } = findBook(collections, collectionId, bookId);
                const candidates = [
                    collection.languageCode,
                    ...book.bloomMeta!.languages!.map((l) => l.lang)
                ];
                expect(candidates).toContain(book.resolvedLang);
            }
        );

        test.each(books)(
            'book $collectionId/$bookId resolvedLang falls back to collection language without langtags',
            ({ collectionId, bookId }) => {
                const { collection, book } = findBook(offlineCollections, collectionId, bookId);
                expect(book.resolvedLang).toBe(collection.languageCode);
            }
        );

        test.each(books)(
            'book $collectionId/$bookId has a single output folder',
            ({ collectionId, bookId }) => {
                const matches = readdirSync(path.join(collectionsDir, collectionId)).filter(
                    (name) => name === bookId || name.startsWith(`${bookId}.`)
                );
                expect(matches).toHaveLength(1);
            }
        );
    });

    describe('Bloom Books converted files', () => {
        test.each(books)(
            'book $collectionId/$bookId file names are NFC',
            ({ collectionId, bookId }) => {
                const notNfc = walkNames(outputDir(collectionId, bookId)).filter(
                    (name) => name !== name.normalize('NFC')
                );
                expect(notNfc).toEqual([]);
            }
        );

        test.each(books)(
            'book $collectionId/$bookId references that resolve in the source resolve in the output',
            ({ collectionId, bookId }) => {
                const srcDir = path.join(dataDir, 'books', collectionId, bookId);
                const srcFiles = new Set(
                    walkFiles(srcDir).map((f) => path.relative(srcDir, f).normalize('NFC'))
                );
                const destDir = outputDir(collectionId, bookId);
                const missing: string[] = [];
                for (const file of markupFiles(collectionId, bookId)) {
                    const refs = extractRefs(readFileSync(file, 'utf-8')).filter(isLocalRef);
                    for (const ref of refs) {
                        const target = path.join(path.dirname(file), refToPath(ref));
                        const relTarget = path.relative(destDir, target).normalize('NFC');
                        if (srcFiles.has(relTarget) && !existsSync(target)) {
                            missing.push(`${path.basename(file)}: ${ref}`);
                        }
                    }
                }
                expect(missing).toEqual([]);
            }
        );

        test.each(books)(
            'book $collectionId/$bookId references are NFC',
            ({ collectionId, bookId }) => {
                const notNfc: string[] = [];
                for (const file of markupFiles(collectionId, bookId)) {
                    for (const ref of extractRefs(readFileSync(file, 'utf-8'))) {
                        const decoded = safeDecode(ref);
                        if (decoded !== decoded.normalize('NFC')) {
                            notNfc.push(`${path.basename(file)}: ${ref}`);
                        }
                    }
                }
                expect(notNfc).toEqual([]);
            }
        );

        test.each(books)(
            'book $collectionId/$bookId has a .distribution file',
            ({ collectionId, bookId }) => {
                const distPath = path.join(outputDir(collectionId, bookId), '.distribution');
                expect(existsSync(distPath)).toBe(true);
                const srcDist = path.join(dataDir, 'books', collectionId, bookId, '.distribution');
                if (!existsSync(srcDist)) {
                    expect(readFileSync(distPath, 'utf-8')).toBe('bloom-web');
                }
            }
        );
    });

    describe('Bloom Books catalog', () => {
        test('every collection has a catalog with bloomBooks matching the config', () => {
            for (const collection of collections) {
                const expected = collection.books
                    .filter((b) => b.type === 'bloom-player')
                    .map((b) => ({ id: b.id, name: b.name }));
                expect(readCatalog(collection).bloomBooks).toEqual(expected);
            }
        });

        test('bloom-only collections still have a catalog', () => {
            const bloomOnly = collections.filter((c) =>
                c.books.every((b) => b.type === 'bloom-player')
            );
            for (const collection of bloomOnly) {
                expect(readCatalog(collection).bloomBooks).not.toHaveLength(0);
            }
        });
    });

    describe('Bloom Books app config (for SAB or RAB)', () => {
        test('font files used by the project exist', () => {
            const missing = parseFonts(document, 0)
                .map((f) => f.file)
                .filter((file) => !existsSync(path.join('src', 'gen-assets', 'fonts', file)));
            expect(missing).toEqual([]);
        });

        test('color themes use valid hex colors', () => {
            const result = parseColorThemes(document, 0);
            expect(result.defaultTheme).toBeTruthy();
            for (const theme of result.themes) {
                expect(theme.name).toBeTruthy();
                for (const cs of theme.colorSets) {
                    for (const value of Object.values(cs.colors)) {
                        expect(value).toMatch(/^#[a-f0-9]{6}$/i);
                    }
                }
            }
        });
    });
});
