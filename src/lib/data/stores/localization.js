import { getLanguages } from '$lib/data/language';
import { derived } from 'svelte/store';
import config from '../config';
import { userSettings } from './setting';

/** localization */

// If a word can't be translated in the current language, use languageDefault.
export const languageDefault = config.translationMappings.defaultLang;

export const languages = getLanguages();
export const language = derived(
    userSettings,
    ($userSettings) => $userSettings['interface-language'] ?? languageDefault
);

export const t = derived(language, ($language) => {
    return Object.keys(config.translationMappings.mappings).reduce((mappings, key) => {
        mappings[key] =
            config.translationMappings.mappings[key][$language] ||
            config.translationMappings.mappings[key][config.translationMappings.defaultLang] ||
            config.translationMappings.mappings[key]['en'];
        return mappings;
    }, {});
});
