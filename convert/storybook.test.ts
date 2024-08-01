import { expect, test } from 'vitest';
import {
    transformLists,
    replacePageTags,
    removeImageTags,
    transformHeadings,
    convertPTags
} from './storybook';

function tokensOf(str: string) {
    return str.split(/\s+/).filter((token) => token.length);
}

test('replace page tags', () => {
    const input = 'abc \\page 41 xyz \\page   45 122';
    const expected = 'abc \\c 41 xyz \\c 45 122';
    const result = replacePageTags(input);
    expect(tokensOf(result)).toEqual(tokensOf(expected));
});

// For now, get image data from config.js (may change this in the future)
test('remove img tags', () => {
    const input = 'abc \\img img1.jpeg efg \\img image-2.jpeg \\img image_with_underscores.jpeg';
    const expected = 'abc efg';
    const result = removeImageTags(input);
    expect(tokensOf(result)).toEqual(tokensOf(expected));
});

test('convertPTags', () => {
    const input = 'abc \\p_Normal hello world \\m \\b';
    const expected = 'abc \\m hello world \\m \\b';
    const result = convertPTags(input);
    expect(tokensOf(result)).toEqual(tokensOf(expected));
});

test('convert unordered list to milestones', () => {
    const input = `
        \\m Some content
        \\zuli1 One
        \\zuli1 Two \\zuli1 Three in a row!
        \\b 
    `;
    const expected = `
        \\m Some content
        \\m
        \\zuli1-s |\\* One \\zuli1-e\\*
        \\zuli1-s |\\* Two \\zuli1-e\\*
        \\zuli1-s |\\* Three in a row! \\zuli1-e\\*
        \\b
    `;
    const result = transformLists(input);
    expect(tokensOf(result)).toEqual(tokensOf(expected));
});

test('convert ordered list to milestones', () => {
    const input = `
        \\m Some content
        \\zon1 10
        \\zoli1 One
        \\zoli1 Two \\zoli1 Three in a row!
        \\b 
    `;
    const expected = `
        \\m Some content
        \\m
        \\zon1-s |start="10"\\*
        \\zoli1-s |\\* One \\zoli1-e\\*
        \\zoli1-s |\\* Two \\zoli1-e\\*
        \\zoli1-s |\\* Three in a row! \\zoli1-e\\*
        \\zon1-e\\*
        \\b
    `;
    const result = transformLists(input);
    expect(tokensOf(result)).toEqual(tokensOf(expected));
});

test('convert unordered list with formatting to milestones', () => {
    const input = `
        \\m Some content
        \\zuli1 One
        \\zuli1 \\bd Two \\bd*
        \\zuli1 Three in a row!
        \\b
    `;
    const expected = `
        \\m Some content
        \\m
        \\zuli1-s |\\* One \\zuli1-e\\*
        \\zuli1-s |\\* \\bd Two \\bd* \\zuli1-e\\*
        \\zuli1-s |\\* Three in a row! \\zuli1-e\\*
        \\b
    `;
    const result = transformLists(input);
    expect(tokensOf(result)).toEqual(tokensOf(expected));
});

test('convert ordered list with formatting to milestones', () => {
    const input = `
        \\m Some content
        \\zon1 10
        \\zoli1 One
        \\zoli1 \\bdit Two \\bdit*
        \\zoli1 Three in a row!
        \\b
    `;
    const expected = `
        \\m Some content
        \\m
        \\zon1-s |start="10"\\*
        \\zoli1-s |\\* One \\zoli1-e\\*
        \\zoli1-s |\\* \\bdit Two \\bdit* \\zoli1-e\\*
        \\zoli1-s |\\* Three in a row! \\zoli1-e\\*
        \\zon1-e\\*
        \\b
    `;
    const result = transformLists(input);
    expect(tokensOf(result)).toEqual(tokensOf(expected));
});

test('convert multilevel unordered list to milestones', () => {
    const input = `
        \\c 2
        \\b
        \\zuli1 Old Testament
            \\zuli2 Pentateuch
                \\zuli3 Genesis
                \\zuli3 Exodus
                \\zuli3 Leviticus
            \\zuli2 Joshua
            \\zuli2 Judges
        \\zuli1 New Testament
            \\zuli2 Matthew
            \\zuli2 Mark
            \\zuli2 Luke
            \\zuli2 John
        \\zuli1 Glossary
    `;
    const expected = `
        \\c 2
        \\b
        \\m
        \\zuli1-s |\\* Old Testament
            \\zuli2-s |\\* Pentateuch
                \\zuli3-s |\\* Genesis \\zuli3-e\\*
                \\zuli3-s |\\* Exodus \\zuli3-e\\*
                \\zuli3-s |\\* Leviticus \\zuli3-e\\*
            \\zuli2-e\\*
            \\zuli2-s |\\* Joshua \\zuli2-e\\*
            \\zuli2-s |\\* Judges \\zuli2-e\\*
        \\zuli1-e\\*
        \\zuli1-s |\\* New Testament
            \\zuli2-s |\\* Matthew \\zuli2-e\\*
            \\zuli2-s |\\* Mark \\zuli2-e\\*
            \\zuli2-s |\\* Luke \\zuli2-e\\*
            \\zuli2-s |\\* John \\zuli2-e\\*
        \\zuli1-e\\*
        \\zuli1-s |\\* Glossary \\zuli1-e\\*
    `;
    const result = transformLists(input);
    expect(tokensOf(result)).toEqual(tokensOf(expected));
});

test('convert multilevel ordered list to milestones', () => {
    const input = `
        \\m My List:
        \\b
        \\zon1 1
        \\zoli1 Food
            \\zon2 1
            \\zoli2 Fruit
                \\zon3 1
                \\zoli3 Apples
                \\zoli3 Bananas
                \\zoli3 Pears
            \\zoli2 Dessert
                \\zoli3 Pie
                \\zoli3 Cake
                \\zoli3 Ice Cream
        \\zoli1 Drinks
            \\zoli2 Coffee
            \\zoli2 Water
            \\zoli2 Tea
    `;
    const expected = `
        \\m My List:
        \\b
        \\m
        \\zon1-s |start="1"\\*
        \\zoli1-s |\\* Food
            \\zon2-s |start="1"\\*
            \\zoli2-s |\\* Fruit
                \\zon3-s |start="1"\\*
                \\zoli3-s |\\* Apples \\zoli3-e\\*
                \\zoli3-s |\\* Bananas \\zoli3-e\\*
                \\zoli3-s |\\* Pears \\zoli3-e\\*
                \\zon3-e\\*
            \\zoli2-e\\*
            \\zoli2-s |\\* Dessert
                \\zon3-s |start="1"\\*
                \\zoli3-s |\\* Pie \\zoli3-e\\*
                \\zoli3-s |\\* Cake \\zoli3-e\\*
                \\zoli3-s |\\* Ice Cream \\zoli3-e\\*
                \\zon3-e\\*
            \\zoli2-e\\*
            \\zon2-e\\*
        \\zoli1-e\\*
        \\zoli1-s |\\* Drinks
            \\zon2-s |start="1"\\*
            \\zoli2-s |\\* Coffee \\zoli2-e\\*
            \\zoli2-s |\\* Water \\zoli2-e\\*
            \\zoli2-s |\\* Tea \\zoli2-e\\*
            \\zon2-e\\*
        \\zoli1-e\\*
        \\zon1-e\\*
    `;
    const result = transformLists(input);
    expect(tokensOf(result)).toEqual(tokensOf(expected));
});

test('convert multilevel ordered list with formatting to milestones', () => {
    const input = `
        \\m Some content
        \\zon1 10
        \\zoli1 One
            \\zon2 3
            \\zoli2 \\it sub-point 1 \\it*
            \\zoli2 sub-point 2
        \\zoli1 \\bdit Two \\bdit*
        \\zoli1 Three in a row!
        \\b
    `;
    const expected = `
        \\m Some content
        \\m
        \\zon1-s |start="10"\\*
        \\zoli1-s |\\* One
            \\zon2-s |start="3"\\*
            \\zoli2-s |\\* \\it sub-point 1 \\it* \\zoli2-e\\*
            \\zoli2-s |\\* sub-point 2 \\zoli2-e\\*
            \\zon2-e\\*
        \\zoli1-e\\*
        \\zoli1-s |\\* \\bdit Two \\bdit* \\zoli1-e\\*
        \\zoli1-s |\\* Three in a row! \\zoli1-e\\*
        \\zon1-e\\*
        \\b
    `;
    const result = transformLists(input);
    expect(tokensOf(result)).toEqual(tokensOf(expected));
});

test('converts section headings to milestones', () => {
    const input = `
        \\ms1 Hello
        \\ms2 World
        \\b
        \\s Some content
        \\s2 Some other content
        \\m
    `;
    const expected = `
        \\m \\zusfm-s |class="ms1"\\* Hello \\zusfm-e
        \\m \\zusfm-s |class="ms2"\\* World \\zusfm-e
        \\b
        \\m \\zusfm-s |class="s"\\* Some content \\zusfm-e
        \\m \\zusfm-s |class="s2"\\* Some other content \\zusfm-e
        \\m
    `;
    const result = transformHeadings(input);
    expect(tokensOf(result)).toEqual(tokensOf(expected));
});
