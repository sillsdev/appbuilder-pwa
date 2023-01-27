import { writable, derived, get } from 'svelte/store';
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

export const t = derived(language, $language => {
    return Object.keys(config.translationMappings.mappings).reduce((mappings, key) => {
        mappings[key] = config.translationMappings.mappings[key][$language] || config.translationMappings.mappings[key][config.translationMappings.defaultLang];
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

export const themeColors = derived(theme, $theme => {
    const theme = config.themes.find(x => x.name == $theme);
    const colorSet = theme.colorSets.find(x => x.type === 'main');
    return colorSet.colors;
});

export const themeBookColors = derived(theme, $theme => {
    const theme = config.themes.find(x => x.name == $theme);
    const colorSet = theme.colorSets.find(x => x.type === 'books');
    return colorSet.colors;    
})

const resolveColor = (colorValue, colors) => {
    if (colorValue.startsWith('#')) {
        return colorValue;
    } else if (colors[colorValue]) {
        return colors[colorValue];
    } 

    // color not in colors map (e.g. 'white' )
    return colorValue;
}

// Convert style to string format for inline styling 
export const convertStyle = (style) => {
  let result = "";
  for(const x in style){
    result += `${x}:${style[x]};`
  }
  return result;
}

export const s = derived(themeColors, $themeColors => {
    return config.styles.reduce((styleProperties, style) => {
        const properties = style.properties;
        let newProperties = {...properties};
        if (newProperties.hasOwnProperty('background-color')) {
            newProperties['background-color'] = resolveColor(newProperties['background-color'],$themeColors);
        }
        if (newProperties.hasOwnProperty('color')) {
            newProperties['color'] = resolveColor(newProperties['color'],$themeColors);
        }
        styleProperties[style.name] = newProperties;
        return styleProperties;
    }, {});
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
