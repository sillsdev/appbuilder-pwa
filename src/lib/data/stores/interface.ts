import config, { scriptureConfig } from '$assets/config';
import type { ScriptureConfig } from '$config';
import { derived } from 'svelte/store';
import { refs } from './scripture';
import { userSettings } from './setting';

export function getTextDirFromText(
    collections: ScriptureConfig['bookCollections'],
    collectionId: string,
    bookId: string
) {
    const collection = collections?.find((x) => x.id === collectionId);
    const book = collection?.books.find((x) => x.id === bookId);
    return normalizeTextDirection(book?.style?.textDirection ?? collection?.style?.textDirection);
}

/**
 * A failed lookup leaves a sentinel ('interface-language' or 'text'), so default to ltr
 */
export function normalizeTextDirection(direction: string | undefined): 'ltr' | 'rtl' {
    return direction?.toLowerCase() === 'rtl' ? 'rtl' : 'ltr';
}

export const direction = derived([refs, userSettings], ([$refs, $userSettings]) => {
    let direction = (
        config.mainFeatures['settings-app-layout-direction']
            ? $userSettings['app-layout-direction']
            : config.mainFeatures['app-layout-direction']
    ) as string;
    if (direction === 'interface-language') {
        const code = $userSettings['interface-language'] as string;
        if (code) {
            direction = config.interfaceLanguages?.writingSystems[code]?.textDirection ?? direction;
        }
    } else if (direction === 'text') {
        direction = getTextDirFromText(
            scriptureConfig.bookCollections,
            $refs.collection,
            $refs.book
        );
    }
    return normalizeTextDirection(direction);
});
