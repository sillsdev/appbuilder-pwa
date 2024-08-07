import { describe, expect, test } from 'vitest';
import { maybeConvertList, maybeConvertOrderedList } from '../convert-lists';
import type { Paragraph } from '../../schema/sofria-schema';

describe('convertUnorderedLists', () => {
    test('preserves normal paragraph', () => {
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
        expect(maybeConvertList(testParagraph)).toEqual(testParagraph);
    });

    test('flat list', () => {
        const testParagraph: Paragraph = {
            type: 'paragraph',
            subtype: 'usfm:m',
            content: [
                {
                    type: 'start_milestone',
                    subtype: 'usfm:zuli1',
                    atts: { unknownDefault_zuli1: [''] }
                },
                'One ',
                { type: 'end_milestone', subtype: 'usfm:zuli1' },
                ' ',
                {
                    type: 'start_milestone',
                    subtype: 'usfm:zuli1',
                    atts: { unknownDefault_zuli1: [''] }
                },
                ' Two ',
                { type: 'end_milestone', subtype: 'usfm:zuli1' },
                ' ',
                {
                    type: 'start_milestone',
                    subtype: 'usfm:zuli1',
                    atts: { unknownDefault_zuli1: [''] }
                },
                ' Three',
                { type: 'end_milestone', subtype: 'usfm:zuli1' }
            ]
        };
        const transformed = {
            type: 'paragraph',
            subtype: 'list_container',
            content: [
                {
                    type: 'graft',
                    new: false,
                    sequence: {
                        type: 'list',
                        blocks: [
                            {
                                type: 'paragraph',
                                subtype: 'list_item',
                                atts: {
                                    htmlClass: 'zuli1'
                                },
                                content: ['One ']
                            },
                            {
                                type: 'paragraph',
                                subtype: 'list_item',
                                atts: {
                                    htmlClass: 'zuli1'
                                },
                                content: [' ', ' Two ']
                            },
                            {
                                type: 'paragraph',
                                subtype: 'list_item',
                                atts: {
                                    htmlClass: 'zuli1'
                                },
                                content: [' ', ' Three']
                            }
                        ]
                    }
                }
            ]
        };
        expect(maybeConvertList(testParagraph)).toEqual(transformed);
    });

    test('flat list with wrappers', () => {
        const testParagraph: Paragraph = {
            type: 'paragraph',
            subtype: 'usfm:m',
            content: [
                {
                    type: 'wrapper',
                    subtype: 'test',
                    content: [
                        {
                            type: 'start_milestone',
                            subtype: 'usfm:zuli1',
                            atts: { unknownDefault_zuli1: [''] }
                        },
                        'One',
                        { type: 'end_milestone', subtype: 'usfm:zuli1' }
                    ]
                },
                {
                    type: 'wrapper',
                    subtype: 'style1',
                    atts: { value: '1' },
                    content: [
                        {
                            type: 'wrapper',
                            subtype: 'style2',
                            content: [
                                ' ',
                                {
                                    type: 'start_milestone',
                                    subtype: 'usfm:zuli1',
                                    atts: { unknownDefault_zuli1: [''] }
                                },
                                'Hello ',
                                {
                                    type: 'wrapper',
                                    subtype: 'style3',
                                    content: [
                                        ' World! ',
                                        { type: 'end_milestone', subtype: 'usfm:zuli1' },
                                        {
                                            type: 'start_milestone',
                                            subtype: 'usfm:zuli1',
                                            atts: { unknownDefault_zuli1: [''] }
                                        },
                                        'Three',
                                        { type: 'end_milestone', subtype: 'usfm:zuli1' },
                                        'Number '
                                    ]
                                },
                                {
                                    type: 'start_milestone',
                                    subtype: 'usfm:zuli1',
                                    atts: { unknownDefault_zuli1: [''] }
                                },
                                'Four',
                                { type: 'end_milestone', subtype: 'usfm:zuli1' }
                            ]
                        }
                    ]
                }
            ]
        };
        const transformed = {
            type: 'paragraph',
            subtype: 'list_container',
            content: [
                {
                    type: 'graft',
                    new: false,
                    sequence: {
                        type: 'list',
                        blocks: [
                            {
                                type: 'paragraph',
                                subtype: 'list_item',
                                atts: {
                                    htmlClass: 'zuli1'
                                },
                                content: [
                                    {
                                        type: 'wrapper',
                                        subtype: 'test',
                                        content: ['One']
                                    }
                                ]
                            },
                            {
                                type: 'paragraph',
                                subtype: 'list_item',
                                atts: {
                                    htmlClass: 'zuli1'
                                },
                                content: [
                                    {
                                        type: 'wrapper',
                                        subtype: 'style1',
                                        atts: { value: '1' },
                                        content: [
                                            {
                                                type: 'wrapper',
                                                subtype: 'style2',
                                                content: [
                                                    ' ',
                                                    'Hello ',
                                                    {
                                                        type: 'wrapper',
                                                        subtype: 'style3',
                                                        content: [' World! ']
                                                    }
                                                ]
                                            }
                                        ]
                                    }
                                ]
                            },
                            {
                                type: 'paragraph',
                                subtype: 'list_item',
                                atts: {
                                    htmlClass: 'zuli1'
                                },
                                content: [
                                    {
                                        type: 'wrapper',
                                        subtype: 'style1',
                                        atts: { value: '1' },
                                        content: [
                                            {
                                                type: 'wrapper',
                                                subtype: 'style2',
                                                content: [
                                                    {
                                                        type: 'wrapper',
                                                        subtype: 'style3',
                                                        content: ['Three']
                                                    }
                                                ]
                                            }
                                        ]
                                    }
                                ]
                            },
                            {
                                type: 'paragraph',
                                subtype: 'list_item',
                                atts: {
                                    htmlClass: 'zuli1'
                                },
                                content: [
                                    {
                                        type: 'wrapper',
                                        subtype: 'style1',
                                        atts: { value: '1' },
                                        content: [
                                            {
                                                type: 'wrapper',
                                                subtype: 'style2',
                                                content: [
                                                    {
                                                        type: 'wrapper',
                                                        subtype: 'style3',
                                                        content: ['Number ']
                                                    },
                                                    'Four'
                                                ]
                                            }
                                        ]
                                    }
                                ]
                            }
                        ]
                    }
                }
            ]
        };
        expect(maybeConvertList(testParagraph)).toEqual(transformed);
    });

    test('multilevel list', () => {
        const testParagraph: Paragraph = {
            type: 'paragraph',
            subtype: 'usfm:m',
            content: [
                {
                    type: 'start_milestone',
                    subtype: 'usfm:zuli1'
                },
                'Old Testament',
                {
                    type: 'start_milestone',
                    subtype: 'usfm:zuli2'
                },
                'Pentateuch',
                {
                    type: 'start_milestone',
                    subtype: 'usfm:zuli3'
                },
                'Genesis',
                { type: 'end_milestone', subtype: 'usfm:zuli3' },
                {
                    type: 'start_milestone',
                    subtype: 'usfm:zuli3'
                },
                'Exodus',
                { type: 'end_milestone', subtype: 'usfm:zuli3' },
                { type: 'end_milestone', subtype: 'usfm:zuli2' },
                {
                    type: 'start_milestone',
                    subtype: 'usfm:zuli2'
                },
                'Joshua',
                { type: 'end_milestone', subtype: 'usfm:zuli2' },
                { type: 'end_milestone', subtype: 'usfm:zuli1' },
                {
                    type: 'start_milestone',
                    subtype: 'usfm:zuli1'
                },
                'New Testament',
                { type: 'end_milestone', subtype: 'usfm:zuli1' }
            ]
        };
        const transformed = {
            type: 'paragraph',
            subtype: 'list_container',
            content: [
                {
                    type: 'graft',
                    new: false,
                    sequence: {
                        type: 'list',
                        blocks: [
                            {
                                type: 'paragraph',
                                subtype: 'list_item',
                                atts: { htmlClass: 'zuli1' },
                                content: [
                                    'Old Testament',
                                    {
                                        type: 'graft',
                                        new: false,
                                        sequence: {
                                            type: 'list',
                                            blocks: [
                                                {
                                                    type: 'paragraph',
                                                    subtype: 'list_item',
                                                    atts: { htmlClass: 'zuli2' },
                                                    content: [
                                                        'Pentateuch',
                                                        {
                                                            type: 'graft',
                                                            new: false,
                                                            sequence: {
                                                                type: 'list',
                                                                blocks: [
                                                                    {
                                                                        type: 'paragraph',
                                                                        subtype: 'list_item',
                                                                        atts: {
                                                                            htmlClass: 'zuli3'
                                                                        },
                                                                        content: ['Genesis']
                                                                    },
                                                                    {
                                                                        type: 'paragraph',
                                                                        subtype: 'list_item',
                                                                        atts: {
                                                                            htmlClass: 'zuli3'
                                                                        },
                                                                        content: ['Exodus']
                                                                    }
                                                                ]
                                                            }
                                                        }
                                                    ]
                                                },
                                                {
                                                    type: 'paragraph',
                                                    subtype: 'list_item',
                                                    atts: { htmlClass: 'zuli2' },
                                                    content: ['Joshua']
                                                }
                                            ]
                                        }
                                    }
                                ]
                            },
                            {
                                type: 'paragraph',
                                subtype: 'list_item',
                                atts: { htmlClass: 'zuli1' },
                                content: ['New Testament']
                            }
                        ]
                    }
                }
            ]
        };

        const converted = maybeConvertList(testParagraph);
        expect(converted).toEqual(transformed);
    });

    test('multilevel list with wrappers', () => {
        const testParagraph: Paragraph = {
            type: 'paragraph',
            subtype: 'usfm:m',
            content: [
                {
                    type: 'wrapper',
                    subtype: 'some_style',
                    content: [
                        {
                            type: 'start_milestone',
                            subtype: 'usfm:zuli1'
                        },
                        'Old Testament',
                        {
                            type: 'start_milestone',
                            subtype: 'usfm:zuli2'
                        },
                        'Pentateuch',
                        {
                            type: 'start_milestone',
                            subtype: 'usfm:zuli3'
                        },
                        'Genesis',
                        { type: 'end_milestone', subtype: 'usfm:zuli3' },
                        {
                            type: 'start_milestone',
                            subtype: 'usfm:zuli3'
                        },
                        'Exodus',
                        { type: 'end_milestone', subtype: 'usfm:zuli3' },
                        { type: 'end_milestone', subtype: 'usfm:zuli2' },
                        {
                            type: 'start_milestone',
                            subtype: 'usfm:zuli2'
                        },
                        'Joshua',
                        { type: 'end_milestone', subtype: 'usfm:zuli2' },
                        { type: 'end_milestone', subtype: 'usfm:zuli1' },
                        {
                            type: 'start_milestone',
                            subtype: 'usfm:zuli1'
                        },
                        'New Testament',
                        { type: 'end_milestone', subtype: 'usfm:zuli1' }
                    ]
                }
            ]
        };
        const transformed = {
            type: 'paragraph',
            subtype: 'list_container',
            content: [
                {
                    type: 'graft',
                    new: false,
                    sequence: {
                        type: 'list',
                        blocks: [
                            {
                                type: 'paragraph',
                                subtype: 'list_item',
                                atts: { htmlClass: 'zuli1' },
                                content: [
                                    {
                                        type: 'wrapper',
                                        subtype: 'some_style',
                                        content: ['Old Testament']
                                    },
                                    {
                                        type: 'graft',
                                        new: false,
                                        sequence: {
                                            type: 'list',
                                            blocks: [
                                                {
                                                    type: 'paragraph',
                                                    subtype: 'list_item',
                                                    atts: { htmlClass: 'zuli2' },
                                                    content: [
                                                        {
                                                            type: 'wrapper',
                                                            subtype: 'some_style',
                                                            content: ['Pentateuch']
                                                        },
                                                        {
                                                            type: 'graft',
                                                            new: false,
                                                            sequence: {
                                                                type: 'list',
                                                                blocks: [
                                                                    {
                                                                        type: 'paragraph',
                                                                        subtype: 'list_item',
                                                                        atts: {
                                                                            htmlClass: 'zuli3'
                                                                        },
                                                                        content: [
                                                                            {
                                                                                type: 'wrapper',
                                                                                subtype:
                                                                                    'some_style',
                                                                                content: ['Genesis']
                                                                            }
                                                                        ]
                                                                    },
                                                                    {
                                                                        type: 'paragraph',
                                                                        subtype: 'list_item',
                                                                        atts: {
                                                                            htmlClass: 'zuli3'
                                                                        },
                                                                        content: [
                                                                            {
                                                                                type: 'wrapper',
                                                                                subtype:
                                                                                    'some_style',
                                                                                content: ['Exodus']
                                                                            }
                                                                        ]
                                                                    }
                                                                ]
                                                            }
                                                        }
                                                    ]
                                                },
                                                {
                                                    type: 'paragraph',
                                                    subtype: 'list_item',
                                                    atts: { htmlClass: 'zuli2' },
                                                    content: [
                                                        {
                                                            type: 'wrapper',
                                                            subtype: 'some_style',
                                                            content: ['Joshua']
                                                        }
                                                    ]
                                                }
                                            ]
                                        }
                                    }
                                ]
                            },
                            {
                                type: 'paragraph',
                                subtype: 'list_item',
                                atts: { htmlClass: 'zuli1' },
                                content: [
                                    {
                                        type: 'wrapper',
                                        subtype: 'some_style',
                                        content: ['New Testament']
                                    }
                                ]
                            }
                        ]
                    }
                }
            ]
        };

        expect(maybeConvertList(testParagraph)).toEqual(transformed);
    });
});

describe('convert ordered list', () => {
    test('preserves normal paragraph', () => {
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
        expect(maybeConvertOrderedList(testParagraph)).toEqual(testParagraph);
    });

    test('flat list', () => {
        const testParagraph: Paragraph = {
            type: 'paragraph',
            subtype: 'usfm:m',
            content: [
                {
                    type: 'wrapper',
                    subtype: 'style',
                    atts: { color: 'red' },
                    content: [
                        {
                            type: 'start_milestone',
                            subtype: 'usfm:zon1',
                            atts: { start: ['1'] }
                        },
                        {
                            type: 'start_milestone',
                            subtype: 'usfm:zoli1',
                            atts: { unknownDefault_zoli1: [''] }
                        },
                        'Apples ',
                        { type: 'end_milestone', subtype: 'usfm:zoli1' },
                        ' ',
                        {
                            type: 'start_milestone',
                            subtype: 'usfm:zoli1',
                            atts: { unknownDefault_zoli1: [''] }
                        },
                        ' Peaches ',
                        { type: 'end_milestone', subtype: 'usfm:zoli1' },
                        ' ',
                        {
                            type: 'start_milestone',
                            subtype: 'usfm:zoli1',
                            atts: { unknownDefault_zoli1: [''] }
                        },
                        ' Pumpkin Pie',
                        { type: 'end_milestone', subtype: 'usfm:zoli1' },
                        { type: 'end_milestone', subtype: 'usfm:zon1' }
                    ]
                }
            ]
        };
        const transformed = {
            type: 'paragraph',
            subtype: 'list_container',
            content: [
                {
                    type: 'graft',
                    new: false,
                    sequence: {
                        type: 'ordered_list',
                        start: '1',
                        blocks: [
                            {
                                type: 'paragraph',
                                subtype: 'list_item',
                                atts: {
                                    htmlClass: 'zoli1'
                                },
                                content: [
                                    {
                                        type: 'wrapper',
                                        subtype: 'style',
                                        atts: { color: 'red' },
                                        content: ['Apples ']
                                    }
                                ]
                            },
                            {
                                type: 'paragraph',
                                subtype: 'list_item',
                                atts: {
                                    htmlClass: 'zoli1'
                                },
                                content: [
                                    {
                                        type: 'wrapper',
                                        subtype: 'style',
                                        atts: { color: 'red' },
                                        content: [' ', ' Peaches ']
                                    }
                                ]
                            },
                            {
                                type: 'paragraph',
                                subtype: 'list_item',
                                atts: {
                                    htmlClass: 'zoli1'
                                },
                                content: [
                                    {
                                        type: 'wrapper',
                                        subtype: 'style',
                                        atts: { color: 'red' },
                                        content: [' ', ' Pumpkin Pie']
                                    }
                                ]
                            }
                        ]
                    }
                }
            ]
        };
        expect(maybeConvertOrderedList(testParagraph)).toEqual(transformed);
    });

    test('flat list with custom start', () => {
        const testParagraph: Paragraph = {
            type: 'paragraph',
            subtype: 'usfm:m',
            content: [
                {
                    type: 'wrapper',
                    subtype: 'style',
                    atts: { color: 'red' },
                    content: [
                        {
                            type: 'start_milestone',
                            subtype: 'usfm:zon1',
                            atts: { start: ['3'] }
                        },
                        {
                            type: 'start_milestone',
                            subtype: 'usfm:zoli1',
                            atts: { unknownDefault_zoli1: [''] }
                        },
                        'Apples ',
                        { type: 'end_milestone', subtype: 'usfm:zoli1' },
                        ' ',
                        {
                            type: 'start_milestone',
                            subtype: 'usfm:zoli1',
                            atts: { unknownDefault_zoli1: [''] }
                        },
                        ' Peaches ',
                        { type: 'end_milestone', subtype: 'usfm:zoli1' },
                        ' ',
                        {
                            type: 'start_milestone',
                            subtype: 'usfm:zoli1',
                            atts: { unknownDefault_zoli1: [''] }
                        },
                        ' Pumpkin Pie',
                        { type: 'end_milestone', subtype: 'usfm:zoli1' },
                        { type: 'end_milestone', subtype: 'usfm:zon1' }
                    ]
                }
            ]
        };
        const transformed = {
            type: 'paragraph',
            subtype: 'list_container',
            content: [
                {
                    type: 'graft',
                    new: false,
                    sequence: {
                        type: 'ordered_list',
                        start: '3',
                        blocks: [
                            {
                                type: 'paragraph',
                                subtype: 'list_item',
                                atts: {
                                    htmlClass: 'zoli1'
                                },
                                content: [
                                    {
                                        type: 'wrapper',
                                        subtype: 'style',
                                        atts: { color: 'red' },
                                        content: ['Apples ']
                                    }
                                ]
                            },
                            {
                                type: 'paragraph',
                                subtype: 'list_item',
                                atts: {
                                    htmlClass: 'zoli1'
                                },
                                content: [
                                    {
                                        type: 'wrapper',
                                        subtype: 'style',
                                        atts: { color: 'red' },
                                        content: [' ', ' Peaches ']
                                    }
                                ]
                            },
                            {
                                type: 'paragraph',
                                subtype: 'list_item',
                                atts: {
                                    htmlClass: 'zoli1'
                                },
                                content: [
                                    {
                                        type: 'wrapper',
                                        subtype: 'style',
                                        atts: { color: 'red' },
                                        content: [' ', ' Pumpkin Pie']
                                    }
                                ]
                            }
                        ]
                    }
                }
            ]
        };
        expect(maybeConvertOrderedList(testParagraph)).toEqual(transformed);
    });

    test('flat list with default start', () => {
        const testParagraph: Paragraph = {
            type: 'paragraph',
            subtype: 'usfm:m',
            content: [
                {
                    type: 'wrapper',
                    subtype: 'style',
                    atts: { color: 'red' },
                    content: [
                        {
                            type: 'start_milestone',
                            subtype: 'usfm:zon1'
                        },
                        {
                            type: 'start_milestone',
                            subtype: 'usfm:zoli1',
                            atts: { unknownDefault_zoli1: [''] }
                        },
                        'Apples ',
                        { type: 'end_milestone', subtype: 'usfm:zoli1' },
                        ' ',
                        {
                            type: 'start_milestone',
                            subtype: 'usfm:zoli1',
                            atts: { unknownDefault_zoli1: [''] }
                        },
                        ' Peaches ',
                        { type: 'end_milestone', subtype: 'usfm:zoli1' },
                        ' ',
                        {
                            type: 'start_milestone',
                            subtype: 'usfm:zoli1',
                            atts: { unknownDefault_zoli1: [''] }
                        },
                        ' Pumpkin Pie',
                        { type: 'end_milestone', subtype: 'usfm:zoli1' },
                        { type: 'end_milestone', subtype: 'usfm:zon1' }
                    ]
                }
            ]
        };
        const transformed = {
            type: 'paragraph',
            subtype: 'list_container',
            content: [
                {
                    type: 'graft',
                    new: false,
                    sequence: {
                        type: 'ordered_list',
                        start: '1',
                        blocks: [
                            {
                                type: 'paragraph',
                                subtype: 'list_item',
                                atts: {
                                    htmlClass: 'zoli1'
                                },
                                content: [
                                    {
                                        type: 'wrapper',
                                        subtype: 'style',
                                        atts: { color: 'red' },
                                        content: ['Apples ']
                                    }
                                ]
                            },
                            {
                                type: 'paragraph',
                                subtype: 'list_item',
                                atts: {
                                    htmlClass: 'zoli1'
                                },
                                content: [
                                    {
                                        type: 'wrapper',
                                        subtype: 'style',
                                        atts: { color: 'red' },
                                        content: [' ', ' Peaches ']
                                    }
                                ]
                            },
                            {
                                type: 'paragraph',
                                subtype: 'list_item',
                                atts: {
                                    htmlClass: 'zoli1'
                                },
                                content: [
                                    {
                                        type: 'wrapper',
                                        subtype: 'style',
                                        atts: { color: 'red' },
                                        content: [' ', ' Pumpkin Pie']
                                    }
                                ]
                            }
                        ]
                    }
                }
            ]
        };
        expect(maybeConvertOrderedList(testParagraph)).toEqual(transformed);
    });

    test('multi-level list', () => {
        const testParagraph: Paragraph = {
            type: 'paragraph',
            subtype: 'usfm:m',
            content: [
                {
                    type: 'wrapper',
                    subtype: 'test_style',
                    atts: { color: 'blue' },
                    content: [
                        {
                            type: 'start_milestone',
                            subtype: 'usfm:zon1',
                            atts: { start: ['1'] }
                        },
                        {
                            type: 'start_milestone',
                            subtype: 'usfm:zoli1',
                            atts: { unknownDefault_zoli1: [''] }
                        },
                        'Food',
                        {
                            type: 'start_milestone',
                            subtype: 'usfm:zon2',
                            atts: { start: ['3'] }
                        },
                        {
                            type: 'start_milestone',
                            subtype: 'usfm:zoli2',
                            atts: { unknownDefault_zoli2: [''] }
                        },
                        'Fruit',
                        {
                            type: 'start_milestone',
                            subtype: 'usfm:zon3',
                            atts: { start: ['1'] }
                        },
                        {
                            type: 'start_milestone',
                            subtype: 'usfm:zoli3',
                            atts: { unknownDefault_zoli3: [''] }
                        },
                        {
                            type: 'wrapper',
                            subtype: 'usfm:bd',
                            content: ['Apples'],
                            atts: {}
                        },
                        { type: 'end_milestone', subtype: 'usfm:zoli3' },
                        {
                            type: 'start_milestone',
                            subtype: 'usfm:zoli3',
                            atts: { unknownDefault_zoli3: [''] }
                        },
                        'Bananas',
                        { type: 'end_milestone', subtype: 'usfm:zoli3' },
                        { type: 'end_milestone', subtype: 'usfm:zon3' },
                        { type: 'end_milestone', subtype: 'usfm:zoli2' },
                        {
                            type: 'start_milestone',
                            subtype: 'usfm:zoli2',
                            atts: { unknownDefault_zoli2: [''] }
                        },
                        'Dessert',
                        { type: 'end_milestone', subtype: 'usfm:zoli2' },
                        { type: 'end_milestone', subtype: 'usfm:zon2' },
                        { type: 'end_milestone', subtype: 'usfm:zoli1' },
                        {
                            type: 'start_milestone',
                            subtype: 'usfm:zoli1',
                            atts: { unknownDefault_zoli1: [''] }
                        },
                        'Drinks',
                        { type: 'end_milestone', subtype: 'usfm:zoli1' },
                        { type: 'end_milestone', subtype: 'usfm:zon1' }
                    ]
                }
            ]
        };
        const transformed = {
            type: 'paragraph',
            subtype: 'list_container',
            content: [
                {
                    type: 'graft',
                    new: false,
                    sequence: {
                        type: 'ordered_list',
                        start: '1',
                        blocks: [
                            {
                                type: 'paragraph',
                                subtype: 'list_item',
                                atts: {
                                    htmlClass: 'zoli1'
                                },
                                content: [
                                    {
                                        type: 'wrapper',
                                        subtype: 'test_style',
                                        atts: { color: 'blue' },
                                        content: ['Food']
                                    },
                                    {
                                        type: 'graft',
                                        new: false,
                                        sequence: {
                                            type: 'ordered_list',
                                            start: '3',
                                            blocks: [
                                                {
                                                    type: 'paragraph',
                                                    subtype: 'list_item',
                                                    atts: { htmlClass: 'zoli2' },
                                                    content: [
                                                        {
                                                            type: 'wrapper',
                                                            subtype: 'test_style',
                                                            atts: { color: 'blue' },
                                                            content: ['Fruit']
                                                        },
                                                        {
                                                            type: 'graft',
                                                            new: false,
                                                            sequence: {
                                                                type: 'ordered_list',
                                                                start: '1',
                                                                blocks: [
                                                                    {
                                                                        type: 'paragraph',
                                                                        subtype: 'list_item',
                                                                        atts: {
                                                                            htmlClass: 'zoli3'
                                                                        },
                                                                        content: [
                                                                            {
                                                                                type: 'wrapper',
                                                                                subtype:
                                                                                    'test_style',
                                                                                atts: {
                                                                                    color: 'blue'
                                                                                },
                                                                                content: [
                                                                                    {
                                                                                        type: 'wrapper',
                                                                                        subtype:
                                                                                            'usfm:bd',
                                                                                        atts: {},
                                                                                        content: [
                                                                                            'Apples'
                                                                                        ]
                                                                                    }
                                                                                ]
                                                                            }
                                                                        ]
                                                                    },
                                                                    {
                                                                        type: 'paragraph',
                                                                        subtype: 'list_item',
                                                                        atts: {
                                                                            htmlClass: 'zoli3'
                                                                        },
                                                                        content: [
                                                                            {
                                                                                type: 'wrapper',
                                                                                subtype:
                                                                                    'test_style',
                                                                                atts: {
                                                                                    color: 'blue'
                                                                                },
                                                                                content: ['Bananas']
                                                                            }
                                                                        ]
                                                                    }
                                                                ]
                                                            }
                                                        }
                                                    ]
                                                },
                                                {
                                                    type: 'paragraph',
                                                    subtype: 'list_item',
                                                    atts: { htmlClass: 'zoli2' },
                                                    content: [
                                                        {
                                                            type: 'wrapper',
                                                            subtype: 'test_style',
                                                            atts: { color: 'blue' },
                                                            content: ['Dessert']
                                                        }
                                                    ]
                                                }
                                            ]
                                        }
                                    }
                                ]
                            },
                            {
                                type: 'paragraph',
                                subtype: 'list_item',
                                atts: {
                                    htmlClass: 'zoli1'
                                },
                                content: [
                                    {
                                        type: 'wrapper',
                                        subtype: 'test_style',
                                        atts: { color: 'blue' },
                                        content: ['Drinks']
                                    }
                                ]
                            }
                        ]
                    }
                }
            ]
        };

        expect(maybeConvertOrderedList(testParagraph)).toEqual(transformed);
    });

    test('Trailing whitespace does not create list item', () => {
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
                            subtype: 'usfm:zon1',
                            atts: { start: ['1'] }
                        },
                        {
                            type: 'start_milestone',
                            subtype: 'usfm:zoli1',
                            atts: { unknownDefault_zoli1: [''] }
                        },
                        'Food ',
                        {
                            type: 'start_milestone',
                            subtype: 'usfm:zon2',
                            atts: { start: ['1'] }
                        },
                        ' ',
                        {
                            type: 'start_milestone',
                            subtype: 'usfm:zoli2',
                            atts: { unknownDefault_zoli2: [''] }
                        },
                        ' Fruit ',
                        { type: 'end_milestone', subtype: 'usfm:zoli2' },
                        ' ',
                        {
                            type: 'start_milestone',
                            subtype: 'usfm:zoli2',
                            atts: { unknownDefault_zoli2: [''] }
                        },
                        ' Dessert ',
                        { type: 'end_milestone', subtype: 'usfm:zoli2' },
                        ' ',
                        { type: 'end_milestone', subtype: 'usfm:zon2' },
                        ' ',
                        { type: 'end_milestone', subtype: 'usfm:zoli1' },
                        ' ',
                        {
                            type: 'start_milestone',
                            subtype: 'usfm:zoli1',
                            atts: { unknownDefault_zoli1: [''] }
                        },
                        ' Drinks ',
                        { type: 'end_milestone', subtype: 'usfm:zoli1' },
                        { type: 'end_milestone', subtype: 'usfm:zon1' }
                    ],
                    atts: { number: '1' }
                }
            ]
        };
        const transformed = {
            type: 'paragraph',
            subtype: 'list_container',
            content: [
                {
                    type: 'graft',
                    new: false,
                    sequence: {
                        type: 'ordered_list',
                        start: '1',
                        blocks: [
                            {
                                type: 'paragraph',
                                subtype: 'list_item',
                                atts: { htmlClass: 'zoli1' },
                                content: [
                                    {
                                        type: 'wrapper',
                                        subtype: 'chapter',
                                        content: ['Food ', ' '],
                                        atts: { number: '1' }
                                    },
                                    {
                                        type: 'graft',
                                        new: false,
                                        sequence: {
                                            type: 'ordered_list',
                                            start: '1',
                                            blocks: [
                                                {
                                                    type: 'paragraph',
                                                    subtype: 'list_item',
                                                    atts: { htmlClass: 'zoli2' },
                                                    content: [
                                                        {
                                                            type: 'wrapper',
                                                            subtype: 'chapter',
                                                            content: [' Fruit '],
                                                            atts: { number: '1' }
                                                        }
                                                    ]
                                                },
                                                {
                                                    type: 'paragraph',
                                                    subtype: 'list_item',
                                                    atts: { htmlClass: 'zoli2' },
                                                    content: [
                                                        {
                                                            type: 'wrapper',
                                                            subtype: 'chapter',
                                                            content: [' ', ' Dessert '],
                                                            atts: { number: '1' }
                                                        }
                                                    ]
                                                }
                                            ]
                                        }
                                    }
                                ]
                            },
                            {
                                type: 'paragraph',
                                subtype: 'list_item',
                                atts: { htmlClass: 'zoli1' },
                                content: [
                                    {
                                        type: 'wrapper',
                                        subtype: 'chapter',
                                        content: [' ', ' Drinks '],
                                        atts: { number: '1' }
                                    }
                                ]
                            }
                        ]
                    }
                }
            ]
        };

        expect(maybeConvertOrderedList(testParagraph)).toEqual(transformed);
    });
});
