import { writable, derived, get } from 'svelte/store';
import { groupStore, referenceStore } from './store-types';
import config from './config';

const setDefaultStorage = (name, value) => {
    if (!localStorage.getItem(name) && value) {
        localStorage.setItem(name, value)
    }
}

/** current reference */
const initReference = config.bookCollections[0].languageCode + "_" + config.bookCollections[0].id + "." + config.mainFeatures['start-at-reference']
setDefaultStorage('refs', initReference);
export const refs = groupStore(referenceStore, localStorage.refs);
refs.subscribe((value) => {
    localStorage.refs = value.docSet + "." + value.book + "." + value.chapter;
});

function createNextRef() {
    const external = writable({book: '', chapter: ''});

    return {
        subscribe: external.subscribe,
        set: external.set,
        reset: () => {
            external.set({book: '', chapter: ''});
        }
    }
}
export const nextRef = createNextRef();

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
setDefaultStorage('audioActive', config.mainFeatures['audio-turn-on-at-startup']);
export const audioActive = writable(localStorage.audioActive === 'true');
audioActive.subscribe(value => localStorage.audioActive = value);
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
setDefaultStorage('bodyFontSize', '17');
export const bodyFontSize = writable(localStorage.bodyFontSize);
bodyFontSize.subscribe((fontSize)  => localStorage.bodyFontSize = fontSize);
/**line height of body elements */
setDefaultStorage('bodyLineHeight', '175');
export const bodyLineHeight = writable(localStorage.bodyLineHeight);
bodyLineHeight.subscribe((lineHeight)=> localStorage.bodyLineHeight = lineHeight);
/**list of selected verses */
function findIndex(id) {
    let references = get(selectedVerses);
    for (let i = 0; i < references.length; i++) {
        const entry = references[i];
        if ((entry.verse == id)) {
            return i;
        }
    }
    return -1;
}
function getInsertIndex(newVerseNumber, selections) {
    let index = 0;
    for (let i = 0; i < selections.length; i++) {
        const verseNumber = Number(selections[i].verse);
        if (verseNumber > newVerseNumber) {
            break;
        }
        index = i + 1;
    }
    return index;
}
function createSelectedVerses()  {
    const external = writable([]);
    
    return {
        subscribe: external.subscribe,
        addVerse: (id, text) => {
            const currentRefs = get(refs);
            const selection = {
               docSet: currentRefs.docSet,
               book: currentRefs.book,
               chapter: currentRefs.chapter,
               verse: id,
               text: text
            }
            let selections = get(external);
            const newVerseNumber = Number(id);
            const newIndex = getInsertIndex(newVerseNumber, selections);
            selections.splice(newIndex, 0, selection);
            external.set(selections);
        },
        removeVerse: (id) => {
            let selections = get(external);
            const index = findIndex(id);
            if (index > -1) {
                selections.splice(index, 1);
                external.set(selections);
            }
        },
        reset: () => {
            external.set([]);
        },
        length: () => {
            let selections = get(external);
            return selections.length;
        },
        getVerseByIndex: (i) => {
            let selections = get(external);
            const index = Number(i);
            if (index > -1 && index < selections.length) {
                return(selections[index]);
            } else {
                const selection = {
                    docSet: "",
                    book: "",
                    chapter: "",
                    verse: "",
                    text: ""
                 }
                return(selection);
            }
        },
        getVerseByVerseNumber: (i) => {
            let selections = get(external);
            const index = findIndex(i);
            if (index > -1) {
                return(selections[index]);
            } else {
                const selection = {
                    docSet: "",
                    book: "",
                    chapter: "",
                    verse: "",
                    text: ""
                 }
                return(selection);
            }
        }
    }
}
export const selectedVerses  = createSelectedVerses();

function createPlayMode() {
    const external = writable(config.mainFeatures['audio-goto-next-chapter'] ? 'continue' : 'stop');
    return {
        subscribe: external.subscribe,
        next: (hasTiming) => {
            const cur = get(external);
            let next = cur;
            switch (cur) {
                case 'continue': next = 'stop'; break;
                case 'stop': next = 'repeatPage'; break;
                case 'repeatPage': next = hasTiming ? 'repeatSelection' : 'continue'; break;
                case 'repeatSelection': next = 'continue'; break;
            }
            external.set(next);
        },
        reset: () => {
            external.set('continue');
        }
    }
}
export const playMode = createPlayMode();