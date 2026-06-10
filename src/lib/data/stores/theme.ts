import config from '$assets/config';
import { derived, writable } from 'svelte/store';
import { setDefaultStorage } from './storage';

//** themes */
export const themes = config.themes?.filter((x) => x.enabled)?.map((theme) => theme.name) ?? [];
export const themeDefault = config.defaultTheme ?? '';
setDefaultStorage('theme', themeDefault);
export const theme = writable(localStorage.theme);
theme.subscribe((value) => (localStorage.theme = value));

export const themeColors = derived(theme, ($theme) => {
    const theme = config.themes?.find((x) => x.name == $theme);
    const colorSet = theme?.colorSets.find((x) => x.type === 'main');
    return colorSet?.colors ?? {};
});

export const themeBookColors = derived(theme, ($theme) => {
    const theme = config.themes?.find((x) => x.name == $theme);
    const colorSet = theme?.colorSets.find((x) => x.type === 'books');
    return colorSet?.colors ?? {};
});

export const monoIconColor = derived(theme, ($theme) => {
    return $theme === 'Dark' ? 'white' : 'black';
});

const resolveColor = (colorValue: string, colors: Record<string, string>) => {
    if (colorValue.startsWith('#')) {
        return colorValue;
    } else if (colors[colorValue]) {
        return colors[colorValue];
    }

    // color not in colors map (e.g. 'white' )
    return colorValue;
};

// Convert style to string format for inline styling
export const convertStyle = (style?: Record<string, string>) => {
    let result = '';
    if (style) {
        for (const x in style) {
            result += `${x}:${style[x]};`;
        }
    }
    return result;
};

export const s = derived(themeColors, ($themeColors) => {
    return config.styles?.reduce(
        (styleProperties, style) => {
            const properties = style.properties;
            const newProperties = { ...properties };
            if (Object.prototype.hasOwnProperty.call(newProperties, 'background-color')) {
                newProperties['background-color'] = resolveColor(
                    newProperties['background-color'],
                    $themeColors
                );
            }
            if (Object.prototype.hasOwnProperty.call(newProperties, 'color')) {
                newProperties['color'] = resolveColor(newProperties['color'], $themeColors);
            }
            styleProperties[style.name] = newProperties;
            return styleProperties;
        },
        {} as Record<string, Record<string, string>>
    );
});

export const actionBarColor = derived(s, ($s) => $s?.['ui.bar.action']['color'] ?? 'inherit');
