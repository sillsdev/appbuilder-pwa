import { describe, expect, test } from 'vitest';
import parseChapterVerseMapInDocSets from './catalog';

type Verse = { number: number; range: string };

const docSetsWith = (cvNumbers: { chapter: string; verses: Verse[] }[]) =>
    ({
        docSets: [
            {
                id: 'ds',
                selectors: [{ key: 'lang', value: 'eng' }],
                tagsKv: [],
                documents: [{ bookCode: 'PSA', sequences: [], cvNumbers }]
            }
        ]
    }) as any;

const versesByChapters = (cvNumbers: { chapter: string; verses: Verse[] }[]) =>
    parseChapterVerseMapInDocSets(docSetsWith(cvNumbers))[0].documents[0].versesByChapters;

describe('parseChapterVerseMapInDocSets', () => {
    test('maps verse numbers to ranges per chapter', () => {
        expect(
            versesByChapters([
                {
                    chapter: '1',
                    verses: [
                        { number: 1, range: '1' },
                        { number: 2, range: '2-3' }
                    ]
                }
            ])
        ).toEqual({ '1': { '1': '1', '2': '2-3' } });
    });

    // #1188: content before \v 1 (e.g. a \d title) shows up as verse 0 and must not count as a verse
    test('drops verse 0', () => {
        const result = versesByChapters([
            {
                chapter: '3',
                verses: [
                    { number: 0, range: '0' },
                    { number: 1, range: '1' },
                    { number: 2, range: '2' }
                ]
            }
        ]);
        expect(result).toEqual({ '3': { '1': '1', '2': '2' } });
        expect(Object.keys(result['3'])).toHaveLength(2);
    });

    test('a chapter with only verse 0 gets an empty verse map', () => {
        expect(versesByChapters([{ chapter: '1', verses: [{ number: 0, range: '0' }] }])).toEqual({
            '1': {}
        });
    });
});
