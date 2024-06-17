import config from '$lib/data/config';
import { extendStringProperty } from '../utils/object-helpers';

interface SearchConfig {
    ignore?: string;
    substitute?: { [char: string]: string };
}

function getConfig(): SearchConfig {
    return parseConfig(config.mainFeatures['search-accents-to-remove']);
}

function parseConfig(accentsToRemove: string): SearchConfig {
    const ignore = parseIgnored(accentsToRemove);
    const substitute = parseSubstitutes(accentsToRemove);
    return { ignore, substitute };
}

function parseSubstitutes(accentsToRemove: string) {
    const sub = {};
    for (const match of accentsToRemove.matchAll(/(\S)>(\S)/g)) {
        extendStringProperty(sub, match[1], match[2]);
        extendStringProperty(sub, match[2], match[1]);
    }
    return sub;
}

function parseIgnored(accentsToRemove: string) {
    let ignore = '';
    for (const c of accentsToRemove.matchAll(/\\u(03\d\d)/g)) {
        const codePoint = parseInt(c[1], 16);
        const char = String.fromCodePoint(codePoint);
        ignore += char;
    }
    return ignore;
}

export const SearchConfigHelpers = { parseConfig, getConfig };
