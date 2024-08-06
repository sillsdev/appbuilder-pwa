import { describe, expect, test } from 'vitest';
import { convertParagraphType, removeMarks } from './pk-adapter';
import type { Content, Graft, Paragraph } from '../schema/sofria-schema';

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
