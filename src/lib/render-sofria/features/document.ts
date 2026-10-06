import { ModalType, monoIconColor } from '$lib/data/stores';
import { deselectAllElements } from '$lib/scripts/verseSelectUtil';
import { addVideoLinks, createVideoBlock } from '$lib/video';
import { get } from 'svelte/store';
import { FeatureSpec, type RenderWorkspace } from '../common';
import { createIllustrationBlock } from './wrappers/figures';
import { addPlanDiv } from './common/plans';

export const documentFeature = new FeatureSpec([
    {
        event: 'startDocument',
        section: 'fallback',
        action({ workspace }) {
            const baseDiv = workspace.document.createElement('div');
            baseDiv.setAttribute('data-verse', 'start');
            baseDiv.setAttribute('data-phrase', 'none');
            deselectAllElements(workspace.root);
            workspace.root.appendChild(baseDiv);
            workspace.scopeManager.push('document', workspace.root);
        }
    },
    {
        event: 'endDocument',
        section: 'fallback',
        action({ workspace, output }) {
            if (!workspace.hackRenderIntro) {
                addNotedVerses(workspace);
                addBookmarkedVerses(workspace);
                addHighlightedVerses(workspace);
                if (showVideo(workspace)) {
                    addVideos(workspace);
                }
                if (showImage(workspace)) {
                    addIllustrations(workspace);
                }
                addPlanDiv(workspace, '-1');
            }

            addFooter(workspace);

            workspace.root.querySelectorAll('a.header-ref').forEach((el) => {
                el.addEventListener('click', (e) =>
                    workspace.events.clickHeaderRef(
                        e as MouseEvent,
                        el as HTMLAnchorElement,
                        workspace
                    )
                );
            });

            workspace.root.querySelectorAll('.seltxt').forEach((el) => {
                el.addEventListener('click', (e) => workspace.events.clickText(e as MouseEvent));
            });

            workspace.scopeManager.pop('document');
            output.root = workspace.root;
        }
    }
]);

function addNotedVerses(workspace: RenderWorkspace) {
    workspace.queries.notes.then((notes) => {
        for (let k = 0; k < notes.length; k++) {
            const note = notes[k];
            const notesContainer = document.getElementById('notes' + note.verse);
            if (!notesContainer) {
                console.warn('No notes span for verse %s', note.verse);
                continue;
            }

            const existingNoteSpan = document.getElementById('note' + k);
            if (!existingNoteSpan) {
                const noteSpan = document.createElement('span');
                noteSpan.id = 'note' + k;
                noteSpan.innerHTML = noteSvg(workspace);
                noteSpan.onclick = (event) => workspace.stores.modal.open(ModalType.Note, note);
                notesContainer.appendChild(noteSpan);
            }
        }
    });
}

function noteSvg(workspace: RenderWorkspace) {
    const noteIconColor: string = workspace.stores.themeColors.TextColor || get(monoIconColor);
    return `<svg fill="${noteIconColor}" style="display:inline" xmlns="http://www.w3.org/2000/svg" height="16" width="16" viewBox="0 0 96 96"><path d="M 21.07 74.80 L 8.76 87.35 Q 8.00 88.12 8.00 87.03 Q 8.00 52.12 8.00 18.00 Q 8.00 7.73 18.00 7.80 Q 48.00 8.00 78.00 8.00 Q 88.27 8.00 88.18 18.00 Q 88.00 40.13 88.09 62.25 Q 88.13 72.31 78.00 72.22 C 72.03 72.17 25.23 70.89 23.56 72.37 Q 22.78 73.07 21.07 74.80 Z M 72.00 21.60 A 0.60 0.60 0.0 0 0 71.40 21.00 L 24.60 21.00 A 0.60 0.60 0.0 0 0 24.00 21.60 L 24.00 28.40 A 0.60 0.60 0.0 0 0 24.60 29.00 L 71.40 29.00 A 0.60 0.60 0.0 0 0 72.00 28.40 L 72.00 21.60 Z M 72.00 35.60 A 0.60 0.60 0.0 0 0 71.40 35.00 L 24.60 35.00 A 0.60 0.60 0.0 0 0 24.00 35.60 L 24.00 42.40 A 0.60 0.60 0.0 0 0 24.60 43.00 L 71.40 43.00 A 0.60 0.60 0.0 0 0 72.00 42.40 L 72.00 35.60 Z M 60.00 49.60 A 0.60 0.60 0.0 0 0 59.40 49.00 L 24.60 49.00 A 0.60 0.60 0.0 0 0 24.00 49.60 L 24.00 56.40 A 0.60 0.60 0.0 0 0 24.60 57.00 L 59.40 57.00 A 0.60 0.60 0.0 0 0 60.00 56.40 L 60.00 49.60 Z"</path></svg>`;
}

function bookmarkSvg() {
    return '<svg fill="#b10000" style="display:inline" xmlns="http://www.w3.org/2000/svg" height="16" width="16" viewBox="0 0 24 24"><path d="M5 21V5q0-.825.588-1.413Q6.175 3 7 3h10q.825 0 1.413.587Q19 4.175 19 5v16l-7-3Z"/></svg>';
}
function addBookmarkedVerses(workspace: RenderWorkspace) {
    workspace.queries.bookmarks.then((bookmarks) => {
        for (let j = 0; j < bookmarks.length; j++) {
            const bookmarksSpan = document.getElementById('bookmarks' + bookmarks[j].verse);
            if (!bookmarksSpan) {
                console.warn('No bookmarks span for verse %s', bookmarks[j].verse);
                continue;
            }

            const existingBookmarkSpan = document.getElementById('bookmark' + j);
            if (!existingBookmarkSpan) {
                const bookmarkSpan = document.createElement('span');
                bookmarkSpan.id = 'bookmark' + j;
                bookmarkSpan.innerHTML = bookmarkSvg();
                bookmarksSpan.appendChild(bookmarkSpan);
            }
        }
    });
}

function addHighlightedVerses(workspace: RenderWorkspace) {
    workspace.queries.highlights.then((highlights) => {
        for (let i = 0; i < highlights.length; i++) {
            //Skip this entry if the next is a highlight for the same verse
            if (i < highlights.length - 1) {
                if (highlights[i].verse === highlights[i + 1].verse) {
                    continue;
                }
            }
            const elements = workspace.root.querySelectorAll(
                `div[data-verse="${highlights[i].verse}"]`
            );
            for (const element of elements ?? []) {
                const penClass = 'hlp' + highlights[i].penColor;
                element.classList.add(penClass);
            }
        }
    });
}

function showImage(workspace: RenderWorkspace) {
    return workspace.viewSettings.illustrations && showImageInBook(workspace);
}
function showImageInBook(workspace: RenderWorkspace) {
    const showBibleImage = workspace.viewSettings.bibleImages === 'normal';
    const showImages = !workspace.viewSettings.isBibleBook || showBibleImage;
    return showImages;
}
function showVideo(workspace: RenderWorkspace) {
    const showBibleVideo = workspace.viewSettings.bibleVideos === 'normal';
    const showVideos = !workspace.viewSettings.isBibleBook || showBibleVideo;
    return showVideos;
}

function videosForChapter(workspace: RenderWorkspace) {
    const collection = workspace.stores.references.docSet.split('_')[1];
    return workspace.config.videos?.filter(
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
    );
}

function illustrationsForChapter(workspace: RenderWorkspace) {
    const collection = workspace.stores.references.docSet.split('_')[1];
    return workspace.config.illustrations?.filter(
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
    );
}

function addVideos(workspace: RenderWorkspace) {
    const videos = videosForChapter(workspace);
    if (videos && workspace.root) {
        videos.forEach((video, index) => {
            if (video.placement) {
                // ref can be MAT 1:1 or MAT.1.1
                const verse = video.placement.ref.split(/[:.]/).at(-1);
                if (verse) {
                    const videoBlockDiv = createVideoBlock(document, video, index);
                    placeElement(workspace, videoBlockDiv, video.placement.pos, verse);
                }
            }
        });
        addVideoLinks(workspace.document, videos);
    }
}

function addIllustrations(workspace: RenderWorkspace) {
    const illustrations = illustrationsForChapter(workspace);
    if (illustrations && workspace.root) {
        illustrations.forEach((illustration, index) => {
            if (illustration.placement) {
                const verse = illustration.placement.ref.split(/[:.]/).at(-1);
                if (verse) {
                    const { imageBlockDiv: illustrationBlockDiv } = createIllustrationBlock(
                        workspace,
                        illustration.filename,
                        illustration.placement.caption
                    );
                    placeElement(
                        workspace,
                        illustrationBlockDiv,
                        illustration.placement.pos,
                        verse
                    );
                }
            }
        });
    }
}

function addFooter(workspace: RenderWorkspace) {
    const collection = workspace.stores.references.docSet.split('_')[1];
    let footer = workspace.config.bookCollections?.find((x) => x.id === collection)?.footer;
    const bookFooter = workspace.config.bookCollections
        ?.find((x) => x.id === collection)
        ?.books.find((x) => x.id === workspace.stores.references.book)?.footer;
    if (bookFooter) {
        footer = bookFooter;
    }

    if (footer && workspace.root.getElementsByClassName('footer').length == 0) {
        const divFooter = workspace.document.createElement('div');
        divFooter.classList.add('footer');
        divFooter.classList.add('md:footer-horizontal');
        const divFooterLine = workspace.document.createElement('div');
        divFooterLine.classList.add('footer-line');
        divFooter.appendChild(divFooterLine);
        const spanFooter = workspace.document.createElement('span');
        spanFooter.classList.add('footer');
        spanFooter.classList.add('md:footer-horizontal');
        spanFooter.innerHTML = footer;
        divFooterLine.appendChild(spanFooter);
        workspace.root.appendChild(divFooter);
    }
}

function placeElement(
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
