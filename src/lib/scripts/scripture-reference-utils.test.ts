/**
 * Vitest file for reference parsing utilities
 *
 * @Author Jake Colbert
 */

import { get } from 'svelte/store';
import { refs } from '$lib/data/stores';
import { describe, test, expect, beforeEach, it } from 'vitest';
import { generateHTML, cvs, rov, lov, roc, cls, collection } from './scripture-reference-utils';

describe('Scripture Reference Utilities', () => {
    describe('generateHTML', () => {
        const ref: any = get(refs);
        const allBookNames = Object.fromEntries(collection.books.map((x) => [x.id, x.name]));
        const docSet = ref.docSet;
        const book1 = allBookNames['JHN'];
        const book2 = allBookNames['1CO'];
        const book3 = allBookNames['JUD'];
        const book4 = allBookNames['EXO'];
        const book5 = allBookNames['MAT'];
        const test0 = `${book1} 3`; // John 3
        const test1 = `${book1} 3${cvs}16`; // John 3:16
        const test2 = `${book1} 3${cvs}16${cls} 3${cvs}17`; // John 3:16; 3:17
        const test3 = `${book1} 3${cvs}16${rov}17`; // John 3:16-17
        const test4 = `${book1} 3${cvs}16${lov}17`; // John 3:16,17
        const test5 = `${book1} 3${cvs}16${cls} 3${cvs}17${rov}18`; // John 3:16; 3:17-18
        const test6 = `${book1} 3${cvs}16${cls} 3${cvs}17${cls} ${book2} 1${cvs}1`; // John 3:16; 3:17; 1 Corinthians 1:1
        const test7 = `${book1} 3${cvs}16${roc}5${cvs}13${cls} 32${cvs}6${rov}9`; // John 3:16-5:13; 32:6-9
        const test8 = `${book3} 6`; // Jude 6
        const test9 = `text| ${book1} 3`; // John 3
        const test10 = `3${cvs}16${rov}17`; // 3:16-17
        const test11 = `${book1} 3${cvs}16${roc}5${cvs}13`; // John 3:16-5:13
        const test12 = `${book4} 20${cvs}13${cls} ${book5} 5${cvs}17${lov}20${rov}22`; // Exodus 20:13; Matthew 5:17,20-22
        const test13 = `Exo 3${cvs}13`; // Exo 3:13
        describe('Simple book chapter (John 3)', () => {
            let result;
            beforeEach(() => {
                result = generateHTML(test0, 'MAT');
            });
            it('has one result', () => {
                const linkCount = result.match(/<a/g).length;
                expect(linkCount).toEqual(1);
            });
            it('has valid text', () => {
                expect(result).toContain('>John 3</a>');
            });
            it('has book ID', () => {
                expect(result).toContain('book&quot;:&quot;JHN&quot;');
            });
            it('has chapter', () => {
                expect(result).toContain('chapter&quot;:&quot;3&quot;');
            });
            it('has a start verse', () => {
                expect(result).toContain('verse&quot;:&quot;1&quot;');
            });
            it('has an end verse', () => {
                expect(result).toContain('verse&quot;:&quot;36&quot;');
            });
        });
        describe('Simple book chapter with text (John 3)', () => {
            let result: any;
            beforeEach(() => {
                result = generateHTML(test9, 'MAT');
            });
            it('has one result', () => {
                const linkCount = result.match(/<a/g).length;
                expect(linkCount).toEqual(1);
            });
            it('has valid text', () => {
                expect(result).toContain('>text</a>');
            });
            it('has book ID', () => {
                expect(result).toContain('book&quot;:&quot;JHN&quot;');
            });
            it('has chapter', () => {
                expect(result).toContain('chapter&quot;:&quot;3&quot;');
            });
            it('has a start verse', () => {
                expect(result).toContain('verse&quot;:&quot;1&quot;');
            });
            it('has an end verse', () => {
                expect(result).toContain('verse&quot;:&quot;36&quot;');
            });
        });
        describe('Simple book chapter (John 3:16)', () => {
            let result: any;
            beforeEach(() => {
                result = generateHTML(test1, 'MAT');
            });
            it('has one result', () => {
                const linkCount = result.match(/<a/g).length;
                expect(linkCount).toEqual(1);
            });
            it('has valid text', () => {
                expect(result).toContain('>John 3:16</a>');
            });
            it('has book ID', () => {
                expect(result).toContain('book&quot;:&quot;JHN&quot;');
            });
            it('has chapter', () => {
                expect(result).toContain('chapter&quot;:&quot;3&quot;');
            });
            it('has a start verse', () => {
                expect(result).toContain('verse&quot;:&quot;16&quot;');
            });
        });
        describe('Book with two chapter verse (John 3:16 3:17)', () => {
            let result: any;
            let results: string[];
            beforeEach(() => {
                result = generateHTML(test2, 'MAT');
                results = result.split('</a>');
            });
            it('has two results', () => {
                const linkCount = result.match(/<a/g).length;
                expect(linkCount).toEqual(2);
            });
            it('first has valid text', () => {
                expect(results[0]).toContain('>John 3:16');
            });
            it('first has book ID', () => {
                expect(results[0]).toContain('book&quot;:&quot;JHN&quot;');
            });
            it('first has chapter', () => {
                expect(results[0]).toContain('chapter&quot;:&quot;3&quot;');
            });
            it('first has verse', () => {
                expect(results[0]).toContain('verse&quot;:&quot;16&quot;');
            });
            it('second has valid text', () => {
                expect(results[1]).toContain('>3:17');
            });
            it('second has book ID', () => {
                expect(results[1]).toContain('book&quot;:&quot;JHN&quot;');
            });
            it('second has chapter', () => {
                expect(results[1]).toContain('chapter&quot;:&quot;3&quot;');
            });
            it('second has verse', () => {
                expect(results[1]).toContain('verse&quot;:&quot;17&quot;');
            });
        });
        describe('Book chapter range (John 3:16-17)', () => {
            let result: any;
            beforeEach(() => {
                result = generateHTML(test3, 'MAT');
            });
            it('has one result', () => {
                const linkCount = result.match(/<a/g).length;
                expect(linkCount).toEqual(1);
            });
            it('has valid text', () => {
                expect(result).toContain('>John 3:16-17</a>');
            });
            it('has book ID', () => {
                expect(result).toContain('book&quot;:&quot;JHN&quot;');
            });
            it('has chapter', () => {
                expect(result).toContain('chapter&quot;:&quot;3&quot;');
            });
            it('has from verse', () => {
                expect(result).toContain('verse&quot;:&quot;16&quot;');
            });
            it('has to verse', () => {
                expect(result).toContain('verse&quot;:&quot;17&quot;');
            });
        });
        describe('chapter range (3:16-17)', () => {
            let result: any;
            beforeEach(() => {
                result = generateHTML(test10, 'MAT');
            });
            it('has one result', () => {
                const linkCount = result.match(/<a/g).length;
                expect(linkCount).toEqual(1);
            });
            it('has valid text', () => {
                expect(result).toContain('>3:16-17</a>');
            });
            it('has current book ID', () => {
                expect(result).toContain('book&quot;:&quot;MAT&quot;');
            });
            it('has chapter', () => {
                expect(result).toContain('chapter&quot;:&quot;3&quot;');
            });
            it('has from verse', () => {
                expect(result).toContain('verse&quot;:&quot;16&quot;');
            });
            it('has to verse', () => {
                expect(result).toContain('verse&quot;:&quot;17&quot;');
            });
        });
        describe('Book with two chapter and verse list (John 3:16,17)', () => {
            let result: any;
            let results: string[];
            beforeEach(() => {
                result = generateHTML(test4, 'MAT');
                results = result.split('</a>');
            });
            it('has two results', () => {
                const linkCount = result.match(/<a/g).length;
                expect(linkCount).toEqual(2);
            });
            it('first has valid text', () => {
                expect(results[0]).toContain('>John 3:16');
            });
            it('first has book ID', () => {
                expect(results[0]).toContain('book&quot;:&quot;JHN&quot;');
            });
            it('first has chapter', () => {
                expect(results[0]).toContain('chapter&quot;:&quot;3&quot;');
            });
            it('first has verse', () => {
                expect(results[0]).toContain('verse&quot;:&quot;16&quot;');
            });
            it('second has valid text', () => {
                expect(results[1]).toContain('>17');
            });
            it('second has book ID', () => {
                expect(results[1]).toContain('book&quot;:&quot;JHN&quot;');
            });
            it('second has chapter', () => {
                expect(results[1]).toContain('chapter&quot;:&quot;3&quot;');
            });
            it('second has verse', () => {
                expect(results[1]).toContain('verse&quot;:&quot;17&quot;');
            });
        });
        describe('Book with two chapter verse (John 3:16 3:17-18)', () => {
            let result: any;
            let results: string[];
            beforeEach(() => {
                result = generateHTML(test5, 'MAT');
                results = result.split('</a>');
            });
            it('has two results', () => {
                const linkCount = result.match(/<a/g).length;
                expect(linkCount).toEqual(2);
            });
            it('first has valid text', () => {
                expect(results[0]).toContain('>John 3:16');
            });
            it('first has book ID', () => {
                expect(results[0]).toContain('book&quot;:&quot;JHN&quot;');
            });
            it('first has chapter', () => {
                expect(results[0]).toContain('chapter&quot;:&quot;3&quot;');
            });
            it('first has verse', () => {
                expect(results[0]).toContain('verse&quot;:&quot;16&quot;');
            });
            it('second has valid text', () => {
                expect(results[1]).toContain('>3:17-18');
            });
            it('second has book ID', () => {
                expect(results[1]).toContain('book&quot;:&quot;JHN&quot;');
            });
            it('second has chapter', () => {
                expect(results[1]).toContain('chapter&quot;:&quot;3&quot;');
            });
            it('second has from verse', () => {
                expect(results[1]).toContain('verse&quot;:&quot;17&quot;');
            });
            it('second has to verse', () => {
                expect(results[1]).toContain('verse&quot;:&quot;18&quot;');
            });
        });
        describe('Book with two chapter verse (John 3:16; 3:17; 1 Corinthians 1:1)', () => {
            let result: any;
            let results: string[];
            beforeEach(() => {
                result = generateHTML(test6, 'MAT');
                results = result.split('</a>');
            });
            it('has three results', () => {
                const linkCount = result.match(/<a/g).length;
                expect(linkCount).toEqual(3);
            });
            it('first has valid text', () => {
                expect(results[0]).toContain('>John 3:16');
            });
            it('first has book ID', () => {
                expect(results[0]).toContain('book&quot;:&quot;JHN&quot;');
            });
            it('first has chapter', () => {
                expect(results[0]).toContain('chapter&quot;:&quot;3&quot;');
            });
            it('first has verse', () => {
                expect(results[0]).toContain('verse&quot;:&quot;16&quot;');
            });
            it('second has valid text', () => {
                expect(results[1]).toContain('>3:17');
            });
            it('second has book ID', () => {
                expect(results[1]).toContain('book&quot;:&quot;JHN&quot;');
            });
            it('second has chapter', () => {
                expect(results[1]).toContain('chapter&quot;:&quot;3&quot;');
            });
            it('second has from verse', () => {
                expect(results[1]).toContain('verse&quot;:&quot;17&quot;');
            });
            it('third has valid text', () => {
                expect(results[2]).toContain('>1 Corinthians 1:1');
            });
            it('third has book ID', () => {
                expect(results[2]).toContain('book&quot;:&quot;1CO&quot;');
            });
            it('third has chapter', () => {
                expect(results[2]).toContain('chapter&quot;:&quot;1&quot;');
            });
            it('third has verse', () => {
                expect(results[2]).toContain('verse&quot;:&quot;1&quot;');
            });
        });
        describe('Book chapter verse chapter verse range (John 3:16-5:13)', () => {
            let result: any;
            beforeEach(() => {
                result = generateHTML(test11, 'MAT');
            });
            it('has one result', () => {
                const linkCount = result.match(/<a/g).length;
                expect(linkCount).toEqual(1);
            });
            it('has valid text', () => {
                expect(result).toContain(`>John 3:16${roc}5:13</a>`);
            });
            it('has book ID', () => {
                expect(result).toContain('book&quot;:&quot;JHN&quot;');
            });
            it('has from chapter', () => {
                expect(result).toContain('chapter&quot;:&quot;3&quot;');
            });
            it('has from verse', () => {
                expect(result).toContain('verse&quot;:&quot;16&quot;');
            });
            it('has to chapter', () => {
                expect(result).toContain('chapter&quot;:&quot;5&quot;');
            });
            it('has to verse', () => {
                expect(result).toContain('verse&quot;:&quot;13&quot;');
            });
        });
        describe('Book chapter verse chapter verse range with chapter verse range (John 3:16-5:13; 32:6-9)', () => {
            let result: any;
            let results: string[];
            beforeEach(() => {
                result = generateHTML(test7, 'MAT');
                results = result.split('</a>');
            });
            it('has two results', () => {
                const linkCount = result.match(/<a/g).length;
                expect(linkCount).toEqual(2);
            });
            it('first has valid text', () => {
                expect(results[0]).toContain(`>John 3:16${roc}5:13`);
            });
            it('first has book ID', () => {
                expect(results[0]).toContain('book&quot;:&quot;JHN&quot;');
            });
            it('first has chapter', () => {
                expect(results[0]).toContain('chapter&quot;:&quot;3&quot;');
            });
            it('first has verse', () => {
                expect(results[0]).toContain('verse&quot;:&quot;16&quot;');
            });
            it('first has to chapter', () => {
                expect(results[0]).toContain('chapter&quot;:&quot;5&quot;');
            });
            it('first has to verse', () => {
                expect(results[0]).toContain('verse&quot;:&quot;13&quot;');
            });
            it('second has valid text', () => {
                expect(results[1]).toContain(`>32:6-9`);
            });
            it('second has book ID', () => {
                expect(results[1]).toContain('book&quot;:&quot;JHN&quot;');
            });
            it('second has chapter', () => {
                expect(results[1]).toContain('chapter&quot;:&quot;32&quot;');
            });
            it('second has from verse', () => {
                expect(results[1]).toContain('verse&quot;:&quot;6&quot;');
            });
            it('second has to verse', () => {
                expect(results[1]).toContain('verse&quot;:&quot;9&quot;');
            });
        });
        describe('Single chapter book (Jude 6)', () => {
            let result: any;
            beforeEach(() => {
                result = generateHTML(test8, 'MAT');
            });
            it('has one result', () => {
                const linkCount = result.match(/<a/g).length;
                expect(linkCount).toEqual(1);
            });
            it('has valid text', () => {
                expect(result).toContain('>Jude 6</a>');
            });
            it('has book ID', () => {
                expect(result).toContain('book&quot;:&quot;JUD&quot;');
            });
            it('has chapter', () => {
                expect(result).toContain('chapter&quot;:&quot;1&quot;');
            });
            it('has verse', () => {
                expect(result).toContain('verse&quot;:&quot;6&quot;');
            });
        });
        describe('Complex entry (Exodus 20:13; Matthew 5:17,20-22)', () => {
            let result: any;
            let results: string[];
            beforeEach(() => {
                result = generateHTML(test12, 'MAT');
                results = result.split('</a>');
            });
            it('has three results', () => {
                const linkCount = result.match(/<a/g).length;
                expect(linkCount).toEqual(3);
            });
            it('first has valid text', () => {
                expect(results[0]).toContain(`>Exodus 20:13`);
            });
            it('first has current book ID', () => {
                expect(results[0]).toContain('book&quot;:&quot;EXO&quot;');
            });
            it('first has chapter', () => {
                expect(results[0]).toContain('chapter&quot;:&quot;20&quot;');
            });
            it('first has from verse', () => {
                expect(results[0]).toContain('verse&quot;:&quot;13&quot;');
            });
            it('second has valid text', () => {
                expect(results[1]).toContain(`>Matthew 5:17`);
            });
            it('second has book ID', () => {
                expect(results[1]).toContain('book&quot;:&quot;MAT&quot;');
            });
            it('second has chapter', () => {
                expect(results[1]).toContain('chapter&quot;:&quot;5&quot;');
            });
            it('second has from verse', () => {
                expect(results[1]).toContain('verse&quot;:&quot;17&quot;');
            });
            it('third has valid text', () => {
                expect(results[2]).toContain(`>20-22`);
            });
            it('third has book ID', () => {
                expect(results[2]).toContain('book&quot;:&quot;MAT&quot;');
            });
            it('third has chapter', () => {
                expect(results[2]).toContain('chapter&quot;:&quot;5&quot;');
            });
            it('third has from verse', () => {
                expect(results[2]).toContain('verse&quot;:&quot;20&quot;');
            });
            it('third has to verse', () => {
                expect(results[2]).toContain('verse&quot;:&quot;22&quot;');
            });
        });
        describe('Book abbreviation used (Exo 3:13)', () => {
            let result: any;
            beforeEach(() => {
                result = generateHTML(test13, 'MAT');
            });
            it('has one result', () => {
                const linkCount = result.match(/<a/g).length;
                expect(linkCount).toEqual(1);
            });
            it('has valid text', () => {
                expect(result).toContain('>Exo 3:13</a>');
            });
            it('has book ID', () => {
                expect(result).toContain('book&quot;:&quot;EXO&quot;');
            });
            it('has chapter', () => {
                expect(result).toContain('chapter&quot;:&quot;3&quot;');
            });
            it('has verse', () => {
                expect(result).toContain('verse&quot;:&quot;13&quot;');
            });
        });
    });
});
