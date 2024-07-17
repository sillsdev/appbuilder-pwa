import { derived } from 'svelte/store';
import { userSettings } from './setting';
import { getLanguages } from '$lib/data/language';
import config from '../config';

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
            config.translationMappings.mappings[key][config.translationMappings.defaultLang];
        return mappings;
    }, {});
});
