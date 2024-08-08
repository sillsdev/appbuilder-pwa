import { describe, expect, test } from 'vitest';
import { convertHeading, convertParagraphType, removeMarks } from '../convert-paragraph';
import type { Content, Paragraph } from '../../schema/sofria-schema';

describe('removeMarks', () => {
    test('with strings', () => {
        const testContent: Content = [
            {
                type: 'mark',
                subtype: 'chapter_label',
                atts: { number: '1' }
            },
            'Hello',
            'World'
        ];
        expect(removeMarks(testContent)).toEqual(['Hello', 'World']);
    });

    test('with wrapper', () => {
        const testContent: Content = [
            {
                type: 'mark',
                subtype: 'chapter_label',
                atts: { number: '1' }
            },
            {
                type: 'wrapper'
            },
            'Hello',
            'World'
        ];
        expect(removeMarks(testContent)).toEqual([
            {
                type: 'wrapper'
            },
            'Hello',
            'World'
        ]);
    });

    test('removes marks within wrappers', () => {
        const testContent: Content = [
            {
                type: 'wrapper',
                subtype: 'chapter',
                content: [
                    {
                        type: 'mark',
                        subtype: 'chapter_label',
                        atts: { number: '5' }
                    },
                    'Hello world!'
                ],
                atts: { number: '5' }
            }
        ];
        const transformed = [
            {
                type: 'wrapper',
                subtype: 'chapter',
                content: ['Hello world!'],
                atts: { number: '5' }
            }
        ];
        expect(removeMarks(testContent)).toEqual(transformed);
    });
});

describe('convertHeading', () => {
    test('does not change regular paragraph', () => {
        const testParagraph: Paragraph = {
            type: 'paragraph',
            subtype: 'usfm:m',
            content: ['hello', ' ', 'world']
        };
        expect(convertHeading(testParagraph)).toEqual(testParagraph);
    });

    test('converts s1 headings to s', () => {
        const testParagraph: Paragraph = {
            type: 'paragraph',
            subtype: 'usfm:s1',
            content: ['hello', ' ', 'world']
        };
        const transformed: Paragraph = {
            type: 'paragraph',
            subtype: 'usfm:s',
            content: ['hello', ' ', 'world']
        };
        expect(convertHeading(testParagraph)).toEqual(transformed);
    });

    test('does not convert s11 to s1', () => {
        const testParagraph: Paragraph = {
            type: 'paragraph',
            subtype: 'usfm:s11',
            content: ['hello', ' ', 'world']
        };
        expect(convertHeading(testParagraph)).toEqual(testParagraph);
    });

    test('converts xxx1 headings to xxx', () => {
        const testParagraph: Paragraph = {
            type: 'paragraph',
            subtype: 'usfm:xxx1',
            content: ['hello', ' ', 'world']
        };
        const transformed: Paragraph = {
            type: 'paragraph',
            subtype: 'usfm:xxx',
            content: ['hello', ' ', 'world']
        };
        expect(convertHeading(testParagraph)).toEqual(transformed);
    });
});

describe('convertParagraphType', () => {
    test('flat string content', () => {
        const testParagraph: Paragraph = {
            type: 'paragraph',
            subtype: 'usfm:m',
            content: [
                {
                    type: 'start_milestone',
                    subtype: 'usfm:zusfm',
                    atts: { class: ['ms2'] }
                },
                'Hello',
                'world',
                { type: 'end_milestone', subtype: 'usfm:zusfm' }
            ]
        };
        const transformed = {
            type: 'paragraph',
            subtype: 'usfm:ms2',
            content: ['Hello', 'world']
        };
        expect(convertParagraphType(testParagraph)).toEqual(transformed);
    });

    test('flat content with non-string elements', () => {
        const testParagraph: Paragraph = {
            type: 'paragraph',
            subtype: 'usfm:m',
            content: [
                {
                    type: 'start_milestone',
                    subtype: 'usfm:zusfm',
                    atts: { class: ['ms2'] }
                },
                'Hello',
                'world',
                { type: 'start_milestone' },
                { type: 'end_milestone' },
                { type: 'wrapper' },
                { type: 'end_milestone', subtype: 'usfm:zusfm' }
            ]
        };
        const transformed = {
            type: 'paragraph',
            subtype: 'usfm:ms2',
            content: [
                'Hello',
                'world',
                { type: 'start_milestone' },
                { type: 'end_milestone' },
                { type: 'wrapper' }
            ]
        };
        expect(convertParagraphType(testParagraph)).toEqual(transformed);
    });

    test('nested content', () => {
        const testParagraph: Paragraph = {
            type: 'paragraph',
            subtype: 'usfm:m',
            content: [
                {
                    type: 'wrapper',
                    subtype: 'chapter',
                    content: [
                        {
                            type: 'start_milestone',
                            subtype: 'usfm:zusfm',
                            atts: { class: ['ms2'] }
                        },
                        'Hello',
                        'world',
                        { type: 'end_milestone', subtype: 'usfm:zusfm' }
                    ],
                    atts: { number: '1' }
                }
            ]
        };
        const transformed = {
            type: 'paragraph',
            subtype: 'usfm:ms2',
            content: [
                {
                    type: 'wrapper',
                    subtype: 'chapter',
                    content: ['Hello', 'world'],
                    atts: { number: '1' }
                }
            ]
        };
        expect(convertParagraphType(testParagraph)).toEqual(transformed);
    });
});
