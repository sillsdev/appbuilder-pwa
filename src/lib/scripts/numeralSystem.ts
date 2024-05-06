export enum NumeralSystem {
    DEFAULT = 'Default',
    BENGALI = 'Bengali',
    DEVANAGARI = 'Devanagari',
    EASTERN_ARABIC = 'Arabic',
    GUJARARTI = 'Gujararti',
    GURMUKHI = 'Gurmukhi',
    KANNADA = 'Kannada',
    KHMER = 'Khmer',
    LAO = 'Lao',
    LIMBU = 'Limbu',
    MALAYALAM = 'Malayalam',
    MONGOLIAN = 'Mongolian',
    MYANMAR = 'Myanmar',
    NKO = "N'Ko",
    ORIYA = 'Oriya',
    PERSIAN = 'Persian',
    TAMIL = 'Tamil',
    TELUGU = 'Telugu',
    THAI = 'Thai',
    TIBETAN = 'Tibetan'
}

export function fromString(text: string): NumeralSystem {
    const system = Object.values(NumeralSystem).find((system) => system === text);
    return (system as NumeralSystem) || NumeralSystem.DEFAULT;
}

export function getStringList(): string[] {
    return Object.values(NumeralSystem) as string[];
}
