/**
 * Vitest file for reference parsing utilities
 *
 * @Author Jake Colbert
 */

import { get } from 'svelte/store';
import { refs } from '$lib/data/stores';
import { describe, test, expect } from 'vitest';
import { parseText, allBookNames, cvs, rov, lov, roc, cls } from './scripture-reference-utils';

describe('Scripture Reference Utilities', () => {
    describe('parseText()', () => {
        const ref: any = get(refs);
        const docSet = ref.docSet;
        const book1 = allBookNames['JHN'];
        const book2 = allBookNames['1CO'];
        const book3 = allBookNames['JUD'];
        const test0 = `${book1} 3`; // John 3
        const test1 = `${book1} 3${cvs}16`; // John 3:16
        const test2 = `${book1} 3${cvs}16${cls} 3${cvs}17`; // John 3:16; 3:17
        const test3 = `${book1} 3${cvs}16${rov}17`; // John 3:16-17
        const test4 = `${book1} 3${cvs}16${lov}17`; // John 3:16,17
        const test5 = `${book1} 3${cvs}16${cls} 3${cvs}17${rov}18`; // John 3:16; 3:17-18
        const test6 = `${book1} 3${cvs}16${cls} 3${cvs}17${cls} ${book2} 1${cvs}1`; // John 3:16; 3:17; 1 Corinthians 1:1
        const test7 = `${book1} 3${cvs}16${roc}5${cvs}13${cls} 32${cvs}6${rov}9`; // John 3:16-5:13; 32:6-9
        const test8 = `${book3} 6`; // Jude 6

        test(`with a simple book and chapter reference:\t\t${test0}`, () => {
            expect(parseText(test0)).toStrictEqual([
                [
                    {
                        phrase: test0,
                        docSet: docSet,
                        book: 'JHN',
                        chapter: '3',
                        verse: undefined
                    }
                ]
            ]);
        });

        test(`with a book, chapter, and verse reference:\t\t${test1}`, () => {
            expect(parseText(test1)).toStrictEqual([
                [
                    {
                        phrase: test1,
                        docSet: docSet,
                        book: 'JHN',
                        chapter: '3',
                        verse: '16'
                    }
                ]
            ]);
        });

        // John 3:16; 3:17
        test(`with a reference inheriting the first's book:\t\t${test2}`, () => {
            const parts = test2.split(`${cls} `);
            expect(parseText(test2)).toStrictEqual([
                [
                    {
                        phrase: parts[0],
                        docSet: docSet,
                        book: 'JHN',
                        chapter: '3',
                        verse: '16'
                    }
                ],
                [
                    {
                        phrase: parts[1],
                        docSet: docSet,
                        book: 'JHN',
                        chapter: '3',
                        verse: '17'
                    }
                ]
            ]);
        });

        // John 3:16-17
        test(`with a reference containing a range of verses:\t\t${test3}`, () => {
            expect(parseText(test3)).toStrictEqual([
                [
                    {
                        phrase: test3,
                        docSet: docSet,
                        book: 'JHN',
                        chapter: '3',
                        verse: '16'
                    },
                    {
                        phrase: test3,
                        docSet: docSet,
                        book: 'JHN',
                        chapter: '3',
                        verse: '17'
                    }
                ]
            ]);
        });

        // John 3:16,17
        test.todo(`with a reference containing a list of verses:\t\t${test4}`, () => {
            const parts = test4.split(`${lov}`);
            expect(parseText(test4)).toStrictEqual([
                [
                    {
                        phrase: parts[0],
                        docSet: docSet,
                        book: 'JHN',
                        chapter: '3',
                        verse: '16'
                    }
                ],
                [
                    {
                        phrase: parts[1],
                        docSet: docSet,
                        book: 'JHN',
                        chapter: '3',
                        verse: '16'
                    }
                ]
            ]);
        });

        // John 3:16; 3:17-18
        test(`with a range of verses and inheritence:\t\t${test5}`, () => {
            const parts = test5.split(`${cls} `);
            expect(parseText(test5)).toStrictEqual([
                [
                    {
                        phrase: parts[0],
                        docSet: docSet,
                        book: 'JHN',
                        chapter: '3',
                        verse: '16'
                    }
                ],
                [
                    {
                        phrase: parts[1],
                        docSet: docSet,
                        book: 'JHN',
                        chapter: '3',
                        verse: '17'
                    },
                    {
                        phrase: parts[1],
                        docSet: docSet,
                        book: 'JHN',
                        chapter: '3',
                        verse: '18'
                    }
                ]
            ]);
        });

        // John 3:16; 3:17; 1 Corinthians 1:1
        test(`with a third reference that shouldn't inherit:\t\t${test6}`, () => {
            const parts = test6.split(`${cls} `);
            expect(parseText(test6)).toStrictEqual([
                [
                    {
                        phrase: parts[0],
                        docSet: docSet,
                        book: 'JHN',
                        chapter: '3',
                        verse: '16'
                    }
                ],
                [
                    {
                        phrase: parts[1],
                        docSet: docSet,
                        book: 'JHN',
                        chapter: '3',
                        verse: '17'
                    }
                ],
                [
                    {
                        phrase: parts[2],
                        docSet: docSet,
                        book: '1CO',
                        chapter: '1',
                        verse: '1'
                    }
                ]
            ]);
        });

        // John 3:16-5:13; 32:6-9
        test(`with a reference containing a chapter range:\t\t${test7}`, () => {
            const parts = test7.split(`${cls} `);
            expect(parseText(test7)).toStrictEqual([
                [
                    {
                        phrase: parts[0],
                        docSet: docSet,
                        book: 'JHN',
                        chapter: '3',
                        verse: '16'
                    },
                    {
                        phrase: parts[0],
                        docSet: docSet,
                        book: 'JHN',
                        chapter: '5',
                        verse: '13'
                    }
                ],
                [
                    {
                        phrase: parts[1],
                        docSet: docSet,
                        book: 'JHN',
                        chapter: '32',
                        verse: '6'
                    },
                    {
                        phrase: parts[1],
                        docSet: docSet,
                        book: 'JHN',
                        chapter: '32',
                        verse: '9'
                    }
                ]
            ]);
        });

        test.todo(`with a book that contains a single chapter:\t\t${test8}`, () => {
            expect(parseText(test8)).toStrictEqual([
                [
                    {
                        phrase: test8,
                        docSet: docSet,
                        book: 'JUD',
                        chapter: '1',
                        verse: '6'
                    }
                ]
            ]);
        });
    });
});
