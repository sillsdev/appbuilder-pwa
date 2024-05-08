import { expect, test, vi } from 'vitest';

import * as num from './numeralSystem';
import { getStyle } from './configUtils';

test('fromString returns Oriya correctly', () => {
    expect(num.systemFromString('Oriya')).toBe(num.NumeralSystemData.ORIYA);
});

test('fromString returns default when string does not match', () => {
    expect(num.systemFromString('bogus')).toBe(num.NumeralSystemData.DEFAULT);
});

test('formatNumber to default', () => {
    expect(num.formatNumber(num.NumeralSystemData.DEFAULT, '48390')).toBe('48390');
});

test('formatNumber to khmer', () => {
    expect(num.formatNumber(num.NumeralSystemData.KHMER, '48390')).toBe(
        '\u17E4\u17E8\u17E3\u17E9\u17E0'
    );
});

test('systemForBook gets numeralSystem from book collection', () => {
    const config = {
        bookCollections: [
            {
                id: 'C01',
                style: {
                    numeralSystem: 'Bengali'
                },
                books: [
                    {
                        id: 'MAT',
                        style: {
                            font: 'something'
                        }
                    }
                ]
            }
        ]
    };
    expect(num.systemForBook(config, 'C01', 'MAT')).toBe(num.NumeralSystemData.BENGALI);
});

test('systemForBook gets numeralSystem from book', () => {
    const config = {
        bookCollections: [
            {
                id: 'C01',
                style: {
                    numeralSystem: 'Bengali'
                },
                books: [
                    {
                        id: 'MAT',
                        style: {
                            font: 'something',
                            numeralSystem: 'Arabic'
                        }
                    }
                ]
            }
        ]
    };
    expect(num.systemForBook(config, 'C01', 'MAT')).toBe(num.NumeralSystemData.EASTERN_ARABIC);
});
