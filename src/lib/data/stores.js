import { writable, derived } from 'svelte/store';
import { groupStore, referenceStore } from './store-types';
import config from './config';

const setDefaultStorage = (name, value) => {
    if (!localStorage.getItem(name) && value) {
        localStorage.setItem(name, value)
    }
}

/** current reference */
setDefaultStorage('refs', config.mainFeatures['start-at-reference']);
export const refs = groupStore(referenceStore);

/** localization */
setDefaultStorage('language', config.translationMappings.defaultLang);
export const language = writable(localStorage.language);
language.subscribe((value) => localStorage.language = value);

export const t = derived(language, lang => {
    return Object.keys(config.translationMappings.mappings).reduce((mappings, key) => {
        mappings[key] = config.translationMappings.mappings[key][lang] || config.translationMappings.mappings[key][config.translationMappings.defaultLang];
        return mappings;
    }, {})
});

/**a group of writable stores to store the top visible verse in a group*/
export const scrolls = groupStore(writable, 'title');
/**the current view/layout mode*/
export const viewMode = writable('Single Pane');
/**is audio active in the app*/
export const audioActive = writable(true);
/**which element should be highlighted as the audio is playing*/
export const audioHighlight = (() => {
    const listener = derived([refs, audioActive], ([$refs, $audioActive]) => {
        reset();
    });

    const reset = () => {
        external.set('0,0,0,0,0');
    }

    const external = writable('0,0,0,0,0');

    return { subscribe: external.subscribe, set: external.set };
})();
/**scrollTop of main window*/
export const mainScroll = writable({ top: 0, height: 0});
/**Font size of body elements */
export const bodyFontSize = writable('17');
/**line height of body elements */
export const bodyLineHeight = writable('175');
