import { writable, derived } from 'svelte/store';
import { setDefaultStorage } from './storage';
import config from '../config';

//** themes */
export const themes = config.themes
    .filter((x) => x.enabled)
    .reduce((themeNames, theme) => {
        themeNames.push(theme.name);
        return themeNames;
    }, []);
export const themeDefault = config.defaultTheme;
setDefaultStorage('theme', themeDefault);
export const theme = writable(localStorage.theme);
theme.subscribe((value) => (localStorage.theme = value));

export const themeColors = derived(theme, ($theme) => {
    const theme = config.themes.find((x) => x.name == $theme);
    const colorSet = theme.colorSets.find((x) => x.type === 'main');
    return colorSet.colors;
});

export const themeBookColors = derived(theme, ($theme) => {
    const theme = config.themes.find((x) => x.name == $theme);
    const colorSet = theme.colorSets.find((x) => x.type === 'books');
    return colorSet.colors;
});

export const monoIconColor = derived(theme, ($theme) => {
    return $theme === 'Dark' ? 'white' : 'black';
});

const resolveColor = (colorValue, colors) => {
    if (colorValue.startsWith('#')) {
        return colorValue;
    } else if (colors[colorValue]) {
        return colors[colorValue];
    }

    // color not in colors map (e.g. 'white' )
    return colorValue;
};

// Convert style to string format for inline styling
export const convertStyle = (style) => {
    let result = '';
    for (const x in style) {
        result += `${x}:${style[x]};`;
    }
    return result;
};

export const s = derived(themeColors, ($themeColors) => {
    return config.styles.reduce((styleProperties, style) => {
        const properties = style.properties;
        let newProperties = { ...properties };
        if (newProperties.hasOwnProperty('background-color')) {
            newProperties['background-color'] = resolveColor(
                newProperties['background-color'],
                $themeColors
            );
        }
        if (newProperties.hasOwnProperty('color')) {
            newProperties['color'] = resolveColor(newProperties['color'], $themeColors);
        }
        styleProperties[style.name] = newProperties;
        return styleProperties;
    }, {});
});
