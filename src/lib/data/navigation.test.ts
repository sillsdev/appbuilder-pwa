import { describe, expect, test, vi } from 'vitest';
import { NavigationContext } from './navigation';
import type { CatalogData } from './catalogData';

class TestNavigationContext extends NavigationContext {
    constructor(fetchCatalog: (docSet: string) => Promise<CatalogData>, config) {
        super();
        this.fetchCatalog = fetchCatalog;
        this.config = config;
    }
}

const config = {
    mainFeatures: {},
    traits: {
        'has-audio': true
    },
    bookCollections: [
        {
            id: 'C01',
            languageCode: 'eng',
            collectionName: 'World English Bible',
            collectionAbbreviation: 'web',
            books: [
                {
                    chapters: 3,
                    chaptersN: '1-3',
                    fonts: [],
                    id: 'MAT',
                    name: 'Matthew',
                    section: 'Gospel',
                    testament: 'NT',
                    abbreviation: 'Mat',
                    audio: [
                        {
                            num: 2
                        }
                    ]
                },
                {
                    chapters: 3,
                    chaptersN: '1-3',
                    fonts: [],
                    id: 'MRK',
                    name: 'Mark',
                    section: 'Gospel',
                    testament: 'NT',
                    abbreviation: 'Mrk',
                    audio: [],
                    file: '71-MRKeng-web.usfm',
                    features: {
                        'wj-marked': true
                    },
                    style: {
                        font: 'font1',
                        lineHeight: 120,
                        numeralSystem: 'Default',
                        textDirection: 'LTR',
                        textSize: 20,
                        verseNumbers: 'default'
                    }
                }
            ]
        },
        {
            id: 'C02',
            languageCode: 'grc',
            collectionName: 'Greek',
            collectionAbbreviation: 'grc',
            collectionDescription: 'Greek New Testament',
            books: [
                {
                    chapters: 1,
                    chaptersN: '1',
                    fonts: [],
                    id: 'MAT',
                    name: 'Matthew',
                    section: 'Gospel',
                    testament: 'NT',
                    abbreviation: 'ΚΑΤΑ ΜΑΤΘΑΙΟΝ',
                    audio: [],
                    file: 'MAT.usfm',
                    features: {}
                }
            ]
        }
    ]
};

const catalog1: CatalogData = {
    id: 'eng_C01',
    selectors: { lang: 'eng', abbr: 'C01' },
    hasMapping: false,
    documents: [
        {
            id: 'MGNjODdlMjIt',
            bookCode: 'MAT',
            h: 'Matthew',
            toc: 'The Good News According to Matthew',
            toc2: 'Matthew',
            toc3: 'Mat',
            sequences: [],
            hasIntroduction: false,
            versesByChapters: {
                1: {
                    1: '1',
                    2: '2',
                    3: '3'
                },
                2: {
                    1: '1',
                    2: '2',
                    3: '3',
                    4: '4'
                },
                3: {
                    1: '1',
                    2: '2'
                }
            }
        },
        {
            id: 'MzI2ZmNjNDgt',
            bookCode: 'MRK',
            h: 'Mark',
            toc: 'The Good News According to Mark',
            toc2: 'Mark',
            toc3: 'Mrk',
            sequences: [],
            hasIntroduction: false,
            versesByChapters: {
                1: {
                    1: '1',
                    2: '2'
                },
                2: {
                    1: '1',
                    2: '2'
                },
                3: {}
            }
        }
    ],
    tags: {}
};

const catalog2: CatalogData = {
    id: 'grc_C02',
    selectors: { lang: 'grc', abbr: 'C02' },
    hasMapping: false,
    documents: [
        {
            id: 'N2I2MTUyYWIt',
            bookCode: 'MAT',
            h: 'Matthew',
            toc: 'ΕΥΑΓΓΕΛΙΟΝ ΚΑΤΑ ΜΑΤΘΑΙΟΝ',
            toc2: 'ΚΑΤΑ ΜΑΤΘΑΙΟΝ',
            toc3: 'ΚΑΤΑ ΜΑΤΘΑΙΟΝ',
            sequences: [],
            hasIntroduction: false,
            versesByChapters: {
                1: {
                    1: '1'
                }
            }
        },
        {
            id: 'OTRlNjY3NGQt',
            bookCode: 'LUK',
            h: 'Luke',
            toc: 'ΕΥΑΓΓΕΛΙΟΝ ΚΑΤΑ ΛΟΥΚΑΝ',
            toc2: 'ΚΑΤΑ ΛΟΥΚΑΝ',
            toc3: 'ΚΑΤΑ ΛΟΥΚΑΝ',
            sequences: [],
            hasIntroduction: false,
            versesByChapters: {}
        }
    ],
    tags: {}
};

function getTestCatalog(docSet: string): Promise<CatalogData> {
    return Promise.resolve(docSet == 'eng_C01' ? catalog1 : catalog2);
}

describe('goToInitial', async () => {
    const navContext = new TestNavigationContext(getTestCatalog, config);
    await navContext.gotoInitial();

    describe('default start reference', () => {
        test('loads first docset', () => {
            expect(navContext.docSet).toBe('eng_C01');
        });

        test('loads first book', () => {
            expect(navContext.book).toBe('MAT');
        });

        test('loads first chapter', () => {
            expect(navContext.chapter).toBe('1');
        });

        test('chapter length is accurate', () => {
            expect(navContext.chapterLength).toBe(3);
        });
    });

    describe('custom start reference', async () => {
        // Make a deep copy of the config, then change mainFeatures property.
        let config2 = JSON.parse(JSON.stringify(config));
        config2['mainFeatures'] = { 'start-at-reference': 'grc_C02.MAT.1' };

        const navContext2 = new TestNavigationContext(getTestCatalog, config2);
        await navContext2.gotoInitial();

        test('loads correct docSet', () => {
            expect(navContext2.docSet).toBe('grc_C02');
        });

        test('loads correct book', () => {
            expect(navContext2.book).toBe('MAT');
        });

        test('loads correct chapter', () => {
            expect(navContext2.chapter).toBe('1');
        });

        test('chapter length is accurate', () => {
            expect(navContext2.chapterLength).toBe(1);
        });
    });

    describe('custom start reference - book and chapter only', async () => {
        // Make a deep copy of the config, then change mainFeatures property.
        let config2 = JSON.parse(JSON.stringify(config));
        config2['mainFeatures'] = { 'start-at-reference': 'MRK.2' };

        const navContext2 = new TestNavigationContext(getTestCatalog, config2);
        await navContext2.gotoInitial();

        test('loads correct docSet', () => {
            expect(navContext2.docSet).toBe('eng_C01');
        });

        test('loads correct book', () => {
            expect(navContext2.book).toBe('MRK');
        });

        test('loads correct chapter', () => {
            expect(navContext2.chapter).toBe('2');
        });

        test('chapter length is accurate', () => {
            expect(navContext2.chapterLength).toBe(2);
        });
    });

    test('loads last reference if provided as argument', async () => {
        const context = new TestNavigationContext(getTestCatalog, config);
        await context.gotoInitial();
        await context.goto('eng_C01', 'MRK', '2', '2');
        const lastRef = context.reference;

        const context2 = new TestNavigationContext(getTestCatalog, config);
        await context2.gotoInitial(lastRef);
        expect(context2.docSet).toBe('eng_C01');
        expect(context2.book).toBe('MRK');
        expect(context2.chapter).toBe('2');
    });

    test('loads catalog for docset', () => {
        expect(navContext.catalog).toBe(catalog1);
    });

    test('loads first verse', () => {
        expect(navContext.verse).toBe('1');
    });

    test('call to goto before gotoInitial is error', () => {
        const context = new TestNavigationContext(getTestCatalog, config);
        expect(() => context.goto('eng_C01', 'MAT', '1', '2')).rejects.toThrowError('gotoInitial');
    });
});

describe('goTo', () => {
    describe('docset changes', async () => {
        const navContext = new TestNavigationContext(getTestCatalog, config);
        await navContext.gotoInitial();
        await navContext.goto('grc_C02', 'MAT', '1', '1');

        test('docSet property updates', () => {
            expect(navContext.docSet).toBe('grc_C02');
        });

        test('catalog updates', () => {
            expect(navContext.catalog).toBe(catalog2);
        });
    });

    test('catalog is not reloaded if docSet does not change', async () => {
        const spyOnCatalog = vi.fn(getTestCatalog);
        const navContext = new TestNavigationContext(spyOnCatalog, config);
        await navContext.gotoInitial();
        await navContext.goto('eng_C01', 'MRK', '1', '2');
        expect(spyOnCatalog).toHaveBeenCalledOnce();
    });

    describe('invalid docSet', async () => {
        const spyOnCatalog = vi.fn(getTestCatalog);
        const navContext = new TestNavigationContext(spyOnCatalog, config);
        await navContext.gotoInitial();
        await navContext.goto('bogus', 'MRK', '1', '2');

        test('keeps old docSet', () => {
            expect(navContext.docSet).toBe('eng_C01');
        });

        test('does not reload catalog', () => {
            expect(spyOnCatalog).toHaveBeenCalledOnce();
        });
    });

    test('book updates if valid', async () => {
        const navContext = new TestNavigationContext(getTestCatalog, config);
        await navContext.gotoInitial();
        await navContext.goto('eng_C01', 'MRK', '1', '1');
        expect(navContext.book).toBe('MRK');
    });

    test('book does not update if invalid', async () => {
        const navContext = new TestNavigationContext(getTestCatalog, config);
        await navContext.gotoInitial();
        await navContext.goto('eng_C01', 'blah', '1', '1');
        expect(navContext.book).toBe('MAT');
    });

    test('chapter updates if valid', async () => {
        const navContext = new TestNavigationContext(getTestCatalog, config);
        await navContext.gotoInitial();
        await navContext.goto('eng_C01', 'MAT', '3', '1');
        expect(navContext.chapter).toBe('3');
    });

    test('chapter does not update if invalid', async () => {
        const navContext = new TestNavigationContext(getTestCatalog, config);
        await navContext.gotoInitial();
        await navContext.goto('eng_C01', 'MAT', '100', '1');
        expect(navContext.chapter).toBe('1');
    });

    test('can navigate to chapter i', async () => {
        const navContext = new TestNavigationContext(getTestCatalog, config);
        await navContext.gotoInitial();
        await navContext.goto('eng_C01', 'MAT', 'i', '1');
        expect(navContext.chapter).toBe('i');
    });

    test('chapter length updates after navigation', async () => {
        const navContext = new TestNavigationContext(getTestCatalog, config);
        await navContext.gotoInitial();
        await navContext.goto('eng_C01', 'MRK', '2', '2');
        expect(navContext.chapterLength).toBe(2);
    });

    test('chapter length is 1 when chapter is i', async () => {
        const navContext = new TestNavigationContext(getTestCatalog, config);
        await navContext.gotoInitial();
        await navContext.goto('eng_C01', 'MRK', 'i', '2');
        expect(navContext.chapterLength).toBe(1);
    });

    // test('chapter length is 1 when versesByChapter is empty', async () => {
    //     // Not sure when this may occur, but old code made provision for it.
    //     const navContext = new TestNavigationContext(getTestCatalog, config);
    //     await navContext.goToInitial();
    //     await navContext.goTo('grc_C02', 'LUK', '1', '1');
    //     expect(navContext.chapterLength).toBe(1);
    // });

    // test('chapter is 1 when versesByChapter is empty', async () => {
    //     // Not sure when this may occur, but old code made provision for it.
    //     const navContext = new TestNavigationContext(getTestCatalog, config);
    //     await navContext.goToInitial();
    //     await navContext.goTo('grc_C02', 'LUK', '2', '1');
    //     expect(navContext.chapter).toBe('1');
    // });

    describe('collection', () => {
        test('after initialization', async () => {
            const navContext = new TestNavigationContext(getTestCatalog, config);
            await navContext.gotoInitial();
            expect(navContext.collection).toBe('C01');
        });

        test('after navigation', async () => {
            const navContext = new TestNavigationContext(getTestCatalog, config);
            await navContext.gotoInitial();
            await navContext.goto('grc_C02', 'MAT', '1', '1');
            expect(navContext.collection).toBe('C02');
        });
    });

    describe('audio', () => {
        test('chapter does not have audio', async () => {
            const navContext = new TestNavigationContext(getTestCatalog, config);
            await navContext.gotoInitial();
            expect(navContext.audio).toBeFalsy();
        });

        test('chapeter has audio', async () => {
            const navContext = new TestNavigationContext(getTestCatalog, config);
            await navContext.gotoInitial();
            await navContext.goto('eng_C01', 'MAT', '2', '2');
            expect(navContext.audio).toBeTruthy();
        });

        test('If book collection has no audio, no chapter has audio', async () => {
            let config2 = JSON.parse(JSON.stringify(config));
            config2.traits['has-audio'] = false;
            const navContext = new TestNavigationContext(getTestCatalog, config2);
            await navContext.gotoInitial();
            await navContext.goto('eng_C01', 'MAT', '2', '2');
            expect(navContext.audio).toBeFalsy();
        });
    });

    describe('title', () => {
        test('after initialization', async () => {
            const navContext = new TestNavigationContext(getTestCatalog, config);
            await navContext.gotoInitial();
            expect(navContext.title).toBe('The Good News According to Matthew');
        });

        test('after navigation', async () => {
            const navContext = new TestNavigationContext(getTestCatalog, config);
            await navContext.gotoInitial();
            await navContext.goto('grc_C01', 'MRK', '1', '1');
            expect(navContext.title).toBe('The Good News According to Mark');
        });
    });

    describe('Name', async () => {
        test('after initialization', async () => {
            const navContext = new TestNavigationContext(getTestCatalog, config);
            await navContext.gotoInitial();
            expect(navContext.name).toBe('Matthew');
        });

        test('after navigation', async () => {
            const navContext = new TestNavigationContext(getTestCatalog, config);
            await navContext.gotoInitial();
            await navContext.goto('grc_C01', 'MRK', '1', '1');
            expect(navContext.name).toBe('Mark');
        });
    });

    describe('next', () => {
        test('next chapter of same book', async () => {
            const navContext = new TestNavigationContext(getTestCatalog, config);
            await navContext.gotoInitial();
            const next = { book: 'MAT', chapter: '2' };
            expect(navContext.next).toStrictEqual(next);
        });

        test('first chapter of next book', async () => {
            const navContext = new TestNavigationContext(getTestCatalog, config);
            await navContext.gotoInitial();
            await navContext.goto('eng_C01', 'MAT', '3', '1');
            const next = { book: 'MRK', chapter: '1' };
            expect(navContext.next).toStrictEqual(next);
        });

        test('null at end of book collection', async () => {
            const navContext = new TestNavigationContext(getTestCatalog, config);
            await navContext.gotoInitial();
            await navContext.goto('eng_C01', 'MRK', '3', '1');
            const next = { book: null, chapter: null };
            expect(navContext.next).toStrictEqual(next);
        });
    });

    describe('prev', () => {
        test('at beginning of collection prev is null', async () => {
            const navContext = new TestNavigationContext(getTestCatalog, config);
            await navContext.gotoInitial();
            await navContext.goto('eng_C01', 'MAT', '3', '1');
            await navContext.goto('eng_C01', 'MAT', '1', '1');
            const prev = { book: null, chapter: null };
            expect(navContext.prev).toStrictEqual(prev);
        });

        test('previous chapter of same book', async () => {
            const navContext = new TestNavigationContext(getTestCatalog, config);
            await navContext.gotoInitial();
            await navContext.goto('eng_C01', 'MAT', '3', '1');
            const prev = { book: 'MAT', chapter: '2' };
            expect(navContext.prev).toStrictEqual(prev);
        });

        test('last chapter of previous book', async () => {
            const navContext = new TestNavigationContext(getTestCatalog, config);
            await navContext.gotoInitial();
            await navContext.goto('eng_C01', 'MRK', '1', '1');
            const prev = { book: 'MAT', chapter: '3' };
            expect(navContext.prev).toStrictEqual(prev);
        });
    });

    describe('gotoNext', () => {
        test('next chapter of same book', async () => {
            const navContext = new TestNavigationContext(getTestCatalog, config);
            await navContext.gotoInitial();

            await navContext.gotoNext();
            expect(navContext.book).toBe('MAT');
            expect(navContext.chapter).toBe('2');
        });

        test('first chapter of next book', async () => {
            const navContext = new TestNavigationContext(getTestCatalog, config);
            await navContext.gotoInitial();
            await navContext.goto('eng_C01', 'MAT', '3', '1');

            await navContext.gotoNext();
            expect(navContext.book).toBe('MRK');
            expect(navContext.chapter).toBe('1');
        });

        test('at end of collection do not advane', async () => {
            const navContext = new TestNavigationContext(getTestCatalog, config);
            await navContext.gotoInitial();
            await navContext.goto('eng_C01', 'MRK', '3', '1');

            await navContext.gotoNext();
            expect(navContext.book).toBe('MRK');
            expect(navContext.chapter).toBe('3');
        });
    });

    describe('gotoPrev', () => {
        test('at beginning of collection do not advance', async () => {
            const navContext = new TestNavigationContext(getTestCatalog, config);
            await navContext.gotoInitial();
            await navContext.goto('eng_C01', 'MAT', '3', '1');
            await navContext.goto('eng_C01', 'MAT', '1', '1');

            await navContext.gotoPrev();
            expect(navContext.book).toBe('MAT');
            expect(navContext.chapter).toBe('1');
        });

        test('previous chapter of same book', async () => {
            const navContext = new TestNavigationContext(getTestCatalog, config);
            await navContext.gotoInitial();
            await navContext.goto('eng_C01', 'MAT', '3', '1');

            await navContext.gotoPrev();
            expect(navContext.book).toBe('MAT');
            expect(navContext.chapter).toBe('2');
        });

        test('last chapter of previous book', async () => {
            const navContext = new TestNavigationContext(getTestCatalog, config);
            await navContext.gotoInitial();
            await navContext.goto('eng_C01', 'MRK', '1', '1');

            await navContext.gotoPrev();
            expect(navContext.book).toBe('MAT');
            expect(navContext.chapter).toBe('3');
        });
    });

    describe('reference', () => {
        test('full reference', async () => {
            const navContext = new TestNavigationContext(getTestCatalog, config);
            await navContext.gotoInitial();
            await navContext.goto('eng_C01', 'MAT', '2', '1');
            expect(navContext.reference).toBe('eng_C01.MAT.2.1');
        });

        test('reference without verse', async () => {
            const navContext = new TestNavigationContext(getTestCatalog, config);
            await navContext.gotoInitial();
            await navContext.goto('eng_C01', 'MAT', '2');
            expect(navContext.reference).toBe('eng_C01.MAT.2');
        });
    });
});
