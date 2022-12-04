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
export const languageDefault = config.translationMappings.defaultLang;
setDefaultStorage('language', languageDefault);
export const languages = Object.keys(config.interfaceLanguages.writingSystems);
export const language = writable(localStorage.language);
language.subscribe(value => localStorage.language = value);

export const t = derived(language, lang => {
    return Object.keys(config.translationMappings.mappings).reduce((mappings, key) => {
        mappings[key] = config.translationMappings.mappings[key][lang] || config.translationMappings.mappings[key][config.translationMappings.defaultLang];
        return mappings;
    }, {})
});

//** themes */
export const themes = config.themes.filter(x => x.enabled).reduce((themeNames, theme) => {
    themeNames.push(theme.name);
    return themeNames
}, []);
export const themeDefault = config.defaultTheme;
setDefaultStorage('theme', themeDefault);
export const theme = writable(localStorage.theme);
theme.subscribe(value => localStorage.theme = value);

export const themeColors = derived(theme, themeName => {
    const theme = config.themes.find(x => x.name == themeName);
    const colorSet = theme.colorSets.find(x => x.type === 'main');
    return colorSet.colors;
});

const resolveColor = (colorValue, colors) => {
    let done = false;
    while (!done) {
        if (colorValue.startsWith('#')) {
            done = true;
        } else if (colors.hasOwnProperty(colorValue)) {
            colorValue = colors[colorValue];
        } else {
            done=true;
        }
    }
    return colorValue;
}
export const s = derived(themeColors, colors => {
    const newStyleProperties = 
    config.styles.reduce((styleProperties, style) => {
        console.log(style);
        if (style.properties.hasOwnProperty('background-color')) {
            style.properties['background-color'] = resolveColor(style.properties['background-color'],colors);
        }
        if (style.properties.hasOwnProperty('color')) {
            style.properties['color'] = resolveColor(style.properties['color'],colors);
        }
        styleProperties[style.name] = style.properties;
        return styleProperties;
    }, {});
    console.log("NEW STYLE PROPERTIES:", newStyleProperties);
    return newStyleProperties;
});

export const s2 = derived(themeColors, colors => {
    const newStyleProperties = 
    config.styles.reduce((styleProperties, style) => {
        console.log(style);
        if (style.properties.hasOwnProperty('background-color')) {
            style.properties['background-color'] = resolveColor(style.properties['background-color'],colors);
        }
        if (style.properties.hasOwnProperty('color')) {
            style.properties['color'] = resolveColor(style.properties['color'],colors);
        }
        for (const key in style.properties) {
            styleProperties[style.name + "_" + key] = style.properties[key];
        }
        return styleProperties;
    }, {});
    console.log("NEW STYLE PROPERTIES:", newStyleProperties);
    return newStyleProperties;
});
// export const styles = (name) => {
//     const style = config.styles.find(x => x.name === name);
//     if (style) {
//         if (style.properties.hasOwnProperty('background-color')) {
//             style.properties['background-color'] = themeColors.get(style.properties['background-color']);
//         }
//         if (style.properties.hasOwnProperty('color')) {
//             style.properties['color'] = themeColors.get(style.properties['color']);
//         } 
//         return style.properties;   
//     }
//     return {};
// }


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
