import { derived } from 'svelte/store';
import { userSettings } from './setting';
import config from '../config';

/** localization */
export const languageDefault = config.translationMappings.defaultLang;
export const languages = Object.keys(config.interfaceLanguages.writingSystems);
export const language = derived(userSettings, $userSettings => $userSettings['interface-language']);

export const t = derived(language, $language => {
    return Object.keys(config.translationMappings.mappings).reduce((mappings, key) => {
        mappings[key] = config.translationMappings.mappings[key][$language] || config.translationMappings.mappings[key][config.translationMappings.defaultLang];
        return mappings;
    }, {})
});
