import { describe, expect, test } from 'vitest';

import * as num from './numeralSystem';

test('fromString returns Oriya correctly', () => {
    expect(num.fromString('Oriya')).toBe(num.NumeralSystemData.ORIYA);
});

test('fromString returns default when string does not match', () => {
    expect(num.fromString('bogus')).toBe(num.NumeralSystemData.DEFAULT);
});

test('formatNumber to default', () => {
    expect(num.formatNumber(num.NumeralSystemData.DEFAULT, '48390')).toBe('48390');
});

test('formatNumber to khmer', () => {
    expect(num.formatNumber(num.NumeralSystemData.KHMER, '48390')).toBe(
        '\u17E4\u17E8\u17E3\u17E9\u17E0'
    );
});
