import { getStyle } from './configUtils';

/**
 * Represent numbers in an internathional numeral system.
 */
export const NumeralSystemData = {
    DEFAULT: { name: 'Default', zero: '0' },
    BENGALI: { name: 'Bengali', zero: '\u09E6' },
    DEVANAGARI: { name: 'Devanagari', zero: '\u0966' },
    EASTERN_ARABIC: { name: 'Arabic', zero: '\u0660' },
    GUJARARTI: { name: 'Gujararti', zero: '\u0AE6' },
    GURMUKHI: { name: 'Gurmukhi', zero: '\u0A66' },
    KANNADA: { name: 'Kannada', zero: '\u0CE6' },
    KHMER: { name: 'Khmer', zero: '\u17E0' },
    LAO: { name: 'Lao', zero: '\u0ED0' },
    LIMBU: { name: 'Limbu', zero: '\u1946' },
    MALAYALAM: { name: 'Malayalam', zero: '\u0D66' },
    MONGOLIAN: { name: 'Mongolian', zero: '\u1810' },
    MYANMAR: { name: 'Myanmar', zero: '\u1040' },
    NKO: { name: "N'Ko", zero: '\u07C0' },
    ORIYA: { name: 'Oriya', zero: '\u0B66' },
    PERSIAN: { name: 'Persian', zero: '\u06F0' },
    TAMIL: { name: 'Tamil', zero: '\u0BE6' },
    TELUGU: { name: 'Telugu', zero: '\u0C66' },
    THAI: { name: 'Thai', zero: '\u0E50' },
    TIBETAN: { name: 'Tibetan', zero: '\u0F20' }
} as const;

export type NumeralSystem = (typeof NumeralSystemData)[keyof typeof NumeralSystemData];

export function systemFromString(text: string): NumeralSystem {
    const system = Object.values(NumeralSystemData).find((system) => system.name === text);
    return system || NumeralSystemData.DEFAULT;
}

export function systemNames(): string[] {
    return Object.values(NumeralSystemData).map((system) => system.name);
}

export function systemForBook(config: any, collection: string, book: string): NumeralSystem {
    const system = getStyle(config, 'numeralSystem', collection, book);
    return systemFromString(system);
}

export function formatNumber(system: NumeralSystem, value: string): any {
    let fmt = '';
    for (let i = 0; i < value.length; i++) {
        const digit = Number(value.charAt(i));
        fmt += formatDigit(system, digit);
    }
    return fmt;
}

function formatDigit(system: NumeralSystem, value: number) {
    return String.fromCharCode(system.zero.charCodeAt(0) + value);
}
