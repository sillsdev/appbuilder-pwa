/**
 * Utility functions for UI language settings
 */
import config from '$lib/data/config';

export function getLanguages() {
    return Object.keys(config.interfaceLanguages.writingSystems);
}

// Get the best language to use as a default.
//
// Use the desired language if it is listed in `available`.
// Otherwise, use a similar language if available (ex: en-US instead of en-UK)
// Otherwise, use the fallback language.
export function findLanguage(desired, fallback, available) {
    let bestSimilarity = 0;
    let bestMatch = fallback;
    available.forEach((lang) => {
        let similarity = compareLanguages(lang, desired);
        if (similarity > bestSimilarity) {
            bestSimilarity = similarity;
            bestMatch = lang;
        }
    });
    return bestMatch;
}

// Choose a default language from among those available.
export function getDefaultLanguage() {
    const fallbackLanguage = config.translationMappings.defaultLang;
    const systemLanguage = window.navigator.language;
    return findLanguage(systemLanguage, fallbackLanguage, getLanguages());
}

function compareLanguages(lang1, lang2) {
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
