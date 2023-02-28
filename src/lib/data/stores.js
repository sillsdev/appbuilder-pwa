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
export const bodyFontSize = writable('17');
/**line height of body elements */
export const bodyLineHeight = writable('175');
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
function createSelectedVerses()  {
    const external = writable([]);
    
    return {
        subscribe: external.subscribe,
        addVerse: (id) => {
            const currentRefs = get(refs);
            const reference = {
               docSet: currentRefs.docSet,
               book: currentRefs.book,
               chapter: currentRefs.chapter,
               verse: id
            }
            let references = get(external);
            references.push(reference);
            external.set(references);
        },
        removeVerse: (id) => {
            const currentRefs = get(refs);
            const reference = {
                docSet: currentRefs.docSet,
                book: currentRefs.book,
                chapter: currentRefs.chapter,
                verse: id
            }
            let references = get(external);
            const index = findIndex(id);
            if (index > -1) {
                references.splice(index, 1);
                external.set(references);
            }
        },
        reset: () => {
            external.set([]);
        },
        length: () => {
            let references = get(external);
            return references.length;
        },
        getFirstVerseIndex: () => {
            let references = get(external);
            let first = -1;
            let index = -1;
            for (let i = 0; i < references.length; i++) {
                if (first == -1 || Number(references[i].verse) < first) {
                    index = i;
                    first = Number(references[i].verse)
                }
            }
            return(index);
        },
        getVerseByIndex: (i) => {
            let references = get(external);
            const index = Number(i);
            console.log("Index: %o", index);
            if (index > -1 && index < references.length) {
                console.log("Return");
                return(references[index])
            } else {
                const reference = {
                    docSet: "",
                    book: "",
                    chapter: "",
                    verse: ""
                 }
                return(reference)
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