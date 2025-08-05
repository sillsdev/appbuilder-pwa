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
        \\nb \\zuli1\\* One
        \\nb \\zuli1\\* Two
        \\nb \\zuli1\\* Three in a row!
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
        \\zon1 |start="10"\\*
        \\nb \\zoli1\\* One
        \\nb \\zoli1\\* Two
        \\nb \\zoli1\\* Three in a row!
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
        \\nb \\zuli1\\* Old Testament
            \\nb \\zuli2\\* Pentateuch
                \\nb \\zuli3\\* Genesis
                \\nb \\zuli3\\* Exodus
                \\nb \\zuli3\\* Leviticus
            \\nb \\zuli2\\* Joshua
            \\nb \\zuli2\\* Judges
        \\nb \\zuli1\\* New Testament
            \\nb \\zuli2\\* Matthew
            \\nb \\zuli2\\* Mark
            \\nb \\zuli2\\* Luke
            \\nb \\zuli2\\* John
        \\nb \\zuli1\\* Glossary
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
        \\zon1 |start="1"\\*
        \\nb \\zoli1\\* Food
            \\zon2 |start="1"\\*
            \\nb \\zoli2\\* Fruit
                \\zon3 |start="1"\\*
                \\nb \\zoli3\\* Apples
                \\nb \\zoli3\\* Bananas
                \\nb \\zoli3\\* Pears
            \\nb \\zoli2\\* Dessert
                \\nb \\zoli3\\* Pie
                \\nb \\zoli3\\* Cake
                \\nb \\zoli3\\* Ice Cream
        \\nb \\zoli1\\* Drinks
            \\nb \\zoli2\\* Coffee
            \\nb \\zoli2\\* Water
            \\nb \\zoli2\\* Tea
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
        \\nb \\zuli1\\* One
        \\nb \\zuli1\\* \\bd Two \\bd*
        \\nb \\zuli1\\* Three in a row!
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
        \\zon1 |start="10"\\*
        \\nb \\zoli1\\* One
        \\nb \\zoli1\\* \\bdit Two \\bdit*
        \\nb \\zoli1\\* Three in a row!
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
        \\zon1 |start="10"\\*
        \\nb \\zoli1\\* One
            \\zon2 |start="3"\\*
            \\nb \\zoli2\\* \\it sub-point 1 \\it*
            \\nb \\zoli2\\* sub-point 2
        \\nb \\zoli1\\* \\bdit Two \\bdit*
        \\nb \\zoli1\\* Three in a row!
        \\b
    `;
    const result = transformLists(input, '', '');
    expect(tokensOf(result)).toEqual(tokensOf(expected));
});
