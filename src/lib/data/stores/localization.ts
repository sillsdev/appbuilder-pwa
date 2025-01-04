import { getLanguages } from '$lib/data/language';
import { derived, type Readable } from 'svelte/store';
import config from '../config';
import { userSettings } from './setting';

/** localization */

// If a word can't be translated in the current language, use languageDefault.
export const languageDefault: string = config.translationMappings.defaultLang;

export const languages: string[] = getLanguages();
export const language: Readable<string> = derived(
    userSettings,
    ($userSettings) => $userSettings['interface-language'] ?? languageDefault
);

export const t: Readable<{ [key: string]: string }> = derived(language, ($language) => {
    return Object.keys(config.translationMappings.mappings).reduce(
        (mappings, key) => {
            mappings[key] =
                config.translationMappings.mappings[key][$language] ||
                config.translationMappings.mappings[key][config.translationMappings.defaultLang];
            return mappings;
        },
        {} as { [key: string]: string }
    );
});
