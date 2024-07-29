import { expect, test } from 'vitest';
import { transformLists, replacePageTags, removeImageTags, transformHeadings } from './storybook';

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

test('convert unordered list to milestones', () => {
    const input = `
        \\m Some content
        \\zuli1 One
        \\zuli1 Two \\zuli1 Three in a row!
        \\b 
    `;
    const expected = `
        \\m Some content
        \\zuli1-s\\* One \\zuli1-e\\*
        \\zuli1-s\\* Two \\zuli1-e\\*
        \\zuli1-s\\* Three in a row! \\zuli1-e\\*
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
        \\zon1-s |start="10"\\*
        \\zoli1-s\\* One \\zoli1-e\\*
        \\zoli1-s\\* Two \\zoli1-e\\*
        \\zoli1-s\\* Three in a row! \\zoli1-e\\*
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
