import { expect, test } from 'vitest';
import { getStyle } from './configUtils';

test('getStyle looks at book collection', () => {
    const config1 = {
        bookCollections: [
            {
                id: 'C01',
                style: {
                    font: 'collectionFont'
                },
                books: [
                    {
                        id: 'MAT'
                    }
                ]
            }
        ]
    };

    expect(getStyle(config1, 'font', 'C01', 'MAT')).toBe('collectionFont');
});

test('getStyle looks at book', () => {
    const config2 = {
        bookCollections: [
            {
                id: 'C01',
                style: {},
                books: [
                    {
                        id: 'MAT',
                        style: {
                            font: 'bookFont'
                        }
                    }
                ]
            }
        ]
    };

    expect(getStyle(config2, 'font', 'C01', 'MAT')).toBe('bookFont');
});

test('getStyle prefers book style over collection sytle', () => {
    const config3 = {
        bookCollections: [
            {
                id: 'C01',
                style: {
                    font: 'collectionFont'
                },
                books: [
                    {
                        id: 'MAT',
                        style: {
                            font: 'bookFont'
                        }
                    }
                ]
            }
        ]
    };

    expect(getStyle(config3, 'font', 'C01', 'MAT')).toBe('bookFont');
});

test('getStyle option missing from collection style', () => {
    const config = {
        bookCollections: [
            {
                id: 'C01',
                style: {
                    font: 'collectionFont'
                },
                books: [
                    {
                        id: 'MAT',
                        style: {}
                    }
                ]
            }
        ]
    };
    expect(getStyle(config, 'font', 'C01', 'MAT')).toBe('collectionFont');
});

test('getStyle option missing from book style', () => {
    const config = {
        bookCollections: [
            {
                id: 'C01',
                style: {},
                books: [
                    {
                        id: 'MAT',
                        style: {
                            font: 'bookFont'
                        }
                    }
                ]
            }
        ]
    };
    expect(getStyle(config, 'font', 'C01', 'MAT')).toBe('bookFont');
});

test('getStyle book inherits style', () => {
    const config = {
        bookCollections: [
            {
                id: 'C01',
                style: {
                    font: 'collectionFont'
                },
                books: [
                    {
                        id: 'MAT',
                        style: {
                            font: 'inherit'
                        }
                    }
                ]
            }
        ]
    };
    expect(getStyle(config, 'font', 'C01', 'MAT')).toBe('collectionFont');
});
