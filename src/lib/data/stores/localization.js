import { writable, derived } from 'svelte/store';
import { setDefaultStorage } from './storage';
import config from '../config';

/** localization */
export const languageDefault = config.translationMappings.defaultLang;
setDefaultStorage('language', languageDefault);
export const languages = Object.keys(config.interfaceLanguages.writingSystems);
export const language = writable(localStorage.language);
language.subscribe(value => localStorage.language = value);

export const t = derived(language, $language => {
    return Object.keys(config.translationMappings.mappings).reduce((mappings, key) => {
        mappings[key] = config.translationMappings.mappings[key][$language] || config.translationMappings.mappings[key][config.translationMappings.defaultLang];
        return mappings;
    }, {})
});
