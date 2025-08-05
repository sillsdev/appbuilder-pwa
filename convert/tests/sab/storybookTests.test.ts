import { expect, test } from 'vitest';
import { transformLists } from '../../convertBooks';

function tokensOf(str: string) {
    return str.split(/\s+/).filter((token) => token.length);
}

test('convert unordered list to milestones', () => {
    const input = `
        \\m Some content
        \\zuli1 One
        \\zuli1 Two \\zuli1 Three in a row!
        \\b 
    `;
    const expected = `
        \\m Some content
        \\nb \\zuli1-s |\\* One
        \\nb \\zuli1-s |\\* Two
        \\nb \\zuli1-s |\\* Three in a row!
        \\b
    `;
    const result = transformLists(input, '', '');
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
        \\zon1-s |start="10"\\*
        \\nb \\zoli1-s |\\* One
        \\nb \\zoli1-s |\\* Two
        \\nb \\zoli1-s |\\* Three in a row!
        \\b
    `;
    const result = transformLists(input, '', '');
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
        \\nb \\zuli1-s |\\* Old Testament
            \\nb \\zuli2-s |\\* Pentateuch
                \\nb \\zuli3-s |\\* Genesis
                \\nb \\zuli3-s |\\* Exodus
                \\nb \\zuli3-s |\\* Leviticus
            \\nb \\zuli2-s |\\* Joshua
            \\nb \\zuli2-s |\\* Judges
        \\nb \\zuli1-s |\\* New Testament
            \\nb \\zuli2-s |\\* Matthew
            \\nb \\zuli2-s |\\* Mark
            \\nb \\zuli2-s |\\* Luke
            \\nb \\zuli2-s |\\* John
        \\nb \\zuli1-s |\\* Glossary
    `;
    const result = transformLists(input, '', '');
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
        \\zon1-s |start="1"\\*
        \\nb \\zoli1-s |\\* Food
            \\zon2-s |start="1"\\*
            \\nb \\zoli2-s |\\* Fruit
                \\zon3-s |start="1"\\*
                \\nb \\zoli3-s |\\* Apples
                \\nb \\zoli3-s |\\* Bananas
                \\nb \\zoli3-s |\\* Pears
            \\nb \\zoli2-s |\\* Dessert
                \\nb \\zoli3-s |\\* Pie
                \\nb \\zoli3-s |\\* Cake
                \\nb \\zoli3-s |\\* Ice Cream
        \\nb \\zoli1-s |\\* Drinks
            \\nb \\zoli2-s |\\* Coffee
            \\nb \\zoli2-s |\\* Water
            \\nb \\zoli2-s |\\* Tea
    `;
    const result = transformLists(input, '', '');
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
        \\nb \\zuli1-s |\\* One
        \\nb \\zuli1-s |\\* \\bd Two \\bd*
        \\nb \\zuli1-s |\\* Three in a row!
        \\b
    `;
    const result = transformLists(input, '', '');
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
        \\zon1-s |start="10"\\*
        \\nb \\zoli1-s |\\* One
        \\nb \\zoli1-s |\\* \\bdit Two \\bdit*
        \\nb \\zoli1-s |\\* Three in a row!
        \\b
    `;
    const result = transformLists(input, '', '');
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
        \\zon1-s |start="10"\\*
        \\nb \\zoli1-s |\\* One
            \\zon2-s |start="3"\\*
            \\nb \\zoli2-s |\\* \\it sub-point 1 \\it*
            \\nb \\zoli2-s |\\* sub-point 2
        \\nb \\zoli1-s |\\* \\bdit Two \\bdit*
        \\nb \\zoli1-s |\\* Three in a row!
        \\b
    `;
    const result = transformLists(input, '', '');
    expect(tokensOf(result)).toEqual(tokensOf(expected));
});
