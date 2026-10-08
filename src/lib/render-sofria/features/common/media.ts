import type { ScriptureConfig } from '$config';
import type { RenderWorkspace } from '$lib/render-sofria/common';

export function placeElement(
    workspace: RenderWorkspace,
    element: HTMLElement,
    pos: string,
    verse: string
) {
    if (workspace.logSettings.placement) {
        console.log('Placing element:', element, 'at', pos, 'of verse', verse);
    }
    if (pos === 'after') {
        // Place after the bookmark element for the verse
        const el = findBookmarkElementForVerse(workspace, parseInt(verse));
        if (el) {
            if (workspace.logSettings.placement) {
                console.log(`Found bookmark element for verse ${verse} at ${el.id}`);
            }
            el.insertAdjacentElement('afterend', element);
        } else {
            console.log('Could not find bookmark element for verse', verse);
        }
    } else if (pos === 'before') {
        let el = findDataElementForVerse(workspace, parseInt(verse));
        if (el) {
            if (el.previousElementSibling?.classList.contains('c-drop')) {
                el = el.previousElementSibling;
            }
            el.insertAdjacentElement('beforebegin', element);
        } else {
            console.log('Could not find data element for verse', verse);
        }
    } else if (pos === 'top') {
        const el = workspace.root.getElementsByClassName('m')[0];
        el.insertAdjacentElement('beforebegin', element);
    } else if (pos === 'bottom') {
        const els = workspace.root.querySelectorAll('span[id^=bookmarks]');
        const el = els[els.length - 1];
        el.insertAdjacentElement('afterend', element);
    }
}

function findBookmarkElementForVerse(workspace: RenderWorkspace, verse: number) {
    const elements = workspace.root.querySelectorAll('[id^="bookmarks"]');

    for (const element of elements) {
        const id = element.id.replace('bookmarks', '');
        const separatorRegex = workspace.textConfig.verseRangeSeparator.replace(
            /[.*+?^${}()|[\]\\]/g,
            '\\$&'
        ); // Escape regex characters
        const rangeMatch = id.match(new RegExp(`^(\\d+)(?:${separatorRegex}(\\d+))?$`));

        if (rangeMatch) {
            const start = parseInt(rangeMatch[1], 10);
            const end = rangeMatch[2] ? parseInt(rangeMatch[2], 10) : start;

            if (verse >= start && verse <= end) {
                return element;
            }
        }
    }

    return null; // No matching element found
}
function findDataElementForVerse(workspace: RenderWorkspace, verse: number) {
    const elements = workspace.root.querySelectorAll('[data-verse][data-phrase="a"]');

    for (const element of elements) {
        const verseData = element.getAttribute('data-verse');
        const separatorRegex = workspace.textConfig.verseRangeSeparator.replace(
            /[.*+?^${}()|[\]\\]/g,
            '\\$&'
        ); // Escape regex characters
        const rangeMatch = verseData?.match(new RegExp(`^(\\d+)(?:${separatorRegex}(\\d+))?$`));

        if (rangeMatch) {
            const start = parseInt(rangeMatch[1], 10);
            const end = rangeMatch[2] ? parseInt(rangeMatch[2], 10) : start;

            if (verse >= start && verse <= end) {
                return element;
            }
        }
    }

    return null; // No matching element found
}

export function mediaForChapter<M extends 'illustrations' | 'videos'>(
    workspace: RenderWorkspace,
    mediaType: M
) {
    const collection = workspace.stores.references.docSet.split('_')[1];
    return (workspace.config[mediaType]?.filter(
        (x) =>
            x.placement &&
            x.placement.collection === collection &&
            (x.placement.ref.startsWith(
                workspace.stores.references.book + ' ' + workspace.stores.references.chapter + ':'
            ) ||
                x.placement.ref.startsWith(
                    workspace.stores.references.book +
                        '.' +
                        workspace.stores.references.chapter +
                        '.'
                ))
    ) ?? []) as NonNullable<ScriptureConfig[M]>;
}
