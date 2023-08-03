/**
 * Vitest file for reference parsing utilities
 *
 * @Author Jake Colbert
 */

import { get } from 'svelte/store';
import { refs } from '$lib/data/stores';
import { expect, test } from 'vitest';
import { parseText, allBookNames, cvs, rov, lov, roc, cls } from './scripture-reference-utils';

const ref: any = get(refs);
const docSet = ref.docSet;
const book1 = allBookNames['JHN'];
const book2 = allBookNames['1CO'];

// APA format reference strings
const test0 = `${book1} 3`; // John 3
const test1 = `${book1} 3${cvs}16`; // John 3:16
const test2 = `${book1} 3${cvs}16${cls} 3${cvs}17`; // John 3:16; 3:17
const test3 = `${book1} 3${cvs}16${rov}17`; // John 3:16-17
const test4 = `${book1} 3${cvs}16${lov}17`; // John 3:16,17
const test5 = `${book1} 3${cvs}16${cls} 3${cvs}17${rov}18`; // John 3:16; 3:17-18
const test6 = `${book1} 3${cvs}16${cls} 3${cvs}17${cls} ${book2} 1${cvs}1`; // John 3:16; 3:17; 1 Corinthians 1:1
const test7 = `${book1} 3${cvs}16${roc}5${cvs}13${cls} 32${cvs}6${rov}9`; // John 3:16-5:13; 32:6-9

// jude 6 would be jude 1:6

/** --- PARSE TEXT TESTS --- */

test(`Evaulating ${test0}`, () => {
    expect(parseText(test0)).toStrictEqual([
        [
            {
                phrase: 'John 3',
                docSet: docSet,
                book: 'JHN',
                chapter: '3',
                verse: undefined
            }
        ]
    ]);
});

test(`Evaulating ${test1}`, () => {
    expect(parseText(test1)).toStrictEqual([
        [
            {
                phrase: 'John 3:16',
                docSet: docSet,
                book: 'JHN',
                chapter: '3',
                verse: '16'
            }
        ]
    ]);
});

// John 3:16; 3:17
test(`Evaulating ${test2}`, () => {
    expect(parseText(test2)).toStrictEqual([
        [
            {
                phrase: 'John 3:16',
                docSet: docSet,
                book: 'JHN',
                chapter: '3',
                verse: '16'
            }
        ],
        [
            {
                phrase: '3:17',
                docSet: docSet,
                book: 'JHN',
                chapter: '3',
                verse: '17'
            }
        ]
    ]);
});

// John 3:16-17
test(`Evaulating ${test3}`, () => {
    expect(parseText(test3)).toStrictEqual([
        [
            {
                phrase: 'John 3:16-17',
                docSet: docSet,
                book: 'JHN',
                chapter: '3',
                verse: '16'
            },
            {
                phrase: 'John 3:16-17',
                docSet: docSet,
                book: 'JHN',
                chapter: '3',
                verse: '17'
            }
        ]
    ]);
});

// // John 3:16,17
// test(`Evaulating ${test4}`, () => {
//     expect(parseText(test4)).toStrictEqual([
//         [
//             {
//                 phrase: 'John 3:16',
//                 docSet: docSet,
//                 book: 'JHN',
//                 chapter: '3',
//                 verse: '16'
//             }
//         ],
//         [
//             {
//                 phrase: '17',
//                 docSet: docSet,
//                 book: 'JHN',
//                 chapter: '3',
//                 verse: '16'
//             }
//         ]
//     ]);
// });

// John 3:16; 3:17-18
test(`Evaulating ${test5}`, () => {
    expect(parseText(test5)).toStrictEqual([
        [
            {
                phrase: 'John 3:16',
                docSet: docSet,
                book: 'JHN',
                chapter: '3',
                verse: '16'
            }
        ],
        [
            {
                phrase: '3:17-18',
                docSet: docSet,
                book: 'JHN',
                chapter: '3',
                verse: '17'
            },
            {
                phrase: '3:17-18',
                docSet: docSet,
                book: 'JHN',
                chapter: '3',
                verse: '18'
            }
        ]
    ]);
});

// John 3:16; 3:17; 1 Corinthians 1:1
test(`Evaulating ${test6}`, () => {
    expect(parseText(test6)).toStrictEqual([
        [
            {
                phrase: 'John 3:16',
                docSet: docSet,
                book: 'JHN',
                chapter: '3',
                verse: '16'
            }
        ],
        [
            {
                phrase: '3:17',
                docSet: docSet,
                book: 'JHN',
                chapter: '3',
                verse: '17'
            }
        ],
        [
            {
                phrase: '1 Corinthians 1:1',
                docSet: docSet,
                book: '1CO',
                chapter: '1',
                verse: '1'
            }
        ]
    ]);
});

// John 3:16-5:13; 32:6-9
test(`Evaulating ${test7}`, () => {
    expect(parseText(test7)).toStrictEqual([
        [
            {
                phrase: 'John 3:16-5:13',
                docSet: docSet,
                book: 'JHN',
                chapter: '3',
                verse: '16'
            },
            {
                phrase: 'John 3:16-5:13',
                docSet: docSet,
                book: 'JHN',
                chapter: '5',
                verse: '13'
            }
        ],
        [
            {
                phrase: '32:6-9',
                docSet: docSet,
                book: 'JHN',
                chapter: '32',
                verse: '6'
            },
            {
                phrase: '32:6-9',
                docSet: docSet,
                book: 'JHN',
                chapter: '32',
                verse: '9'
            }
        ]
    ]);
});
