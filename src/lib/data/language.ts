/**
 * Utility functions for UI language settings
 */
import config from '$lib/data/config';

export function getLanguages() {
    return Object.keys(config.interfaceLanguages.writingSystems);
}

/**
 * Find the language in `available` that matches `desired`.
 *
 * If `available` contains `desired`, return `desired`.
 * Otherwise, return a similar language in `available` (ex: en-US instead of en-UK)
 * Otherwise, return null
 */
export function findLanguage(desired: string, available: string[]): string {
    let bestSimilarity = 0;
    let bestMatch: string = null;
    available.forEach((lang) => {
        let similarity = compareLanguages(lang, desired);
        if (similarity > bestSimilarity) {
            bestSimilarity = similarity;
            bestMatch = lang;
        }
    });
    return bestMatch;
}

/**
 * Get the first language in `preferred` that matches a language in `available`.
 */
export function findBestLanguage(
    preferred: readonly string[],
    fallback: string,
    available: string[]
): string {
    let best = fallback;
    for (let i = 0; i < preferred.length; i++) {
        let match = findLanguage(preferred[i], available);
        if (match !== null) {
            best = match;
            break;
        }
    }
    return best;
}

/** Choose a default language from among those available. */
export function getDefaultLanguage(): string {
    const fallbackLanguage = config.translationMappings.defaultLang;
    if (config.interfaceLanguages.useSystemLanguage) {
        const systemLanguages = window.navigator.languages;
        return findBestLanguage(systemLanguages, fallbackLanguage, getLanguages());
    }
    return fallbackLanguage;
}

/**
 * Return a score representing how similar the two language codes are.
 *
 * The following languages are ranked in their similarity with 'en-US':
 *      en-US   (Perfect match)
 *      en      (More general)
 *      en-UK   (Different locale)
 *      fr      (Completely different)
 */
function compareLanguages(lang1: string, lang2: string): number {
    let parts1 = lang1.split('-');
    let parts2 = lang2.split('-');
    const n = Math.min(parts1.length, parts2.length);
    for (let i = 0; i < n; i++) {
        if (parts1[i] !== parts2[i]) {
            // Subtract a fraction because the rest of the tag does not match.
            // This allows 'en-US' to match 'en' more strongly than 'en-UK'.
            return i - 0.5;
        }
    }
    return n;
}
