import {
    FeatureSpec,
    noaction,
    renderIfRegularOrIfHackedIntro,
    type RenderWorkspace
} from '$lib/render-sofria/common';
import { isBibleBook } from '$lib/scripts/scripture-reference-utils';
import type { RenderElement } from 'proskomma-json-tools';
import { getElement, matchElement, matchSequence } from './common';
import { placeElement } from './common/media';
import { terminatePhrase } from './common/text';
import { renderGraftedSequence, type BlockGraftScratch } from './grafts/common';
import type { SharedTextScratch } from './text';

const illustrationFiles = import.meta.glob('./*', {
    import: 'default',
    eager: true,
    query: '?url',
    base: '/src/gen-assets/illustrations'
}) as Record<string, string>;

export const illustrations = new FeatureSpec<BlockGraftScratch & SharedTextScratch>(
    [
        {
            event: 'startSequence',
            stage: 'standard',
            guard: ({ workspace, context }) =>
                renderIfRegularOrIfHackedIntro(workspace) && matchSequence(context, 'fig'),
            action: noaction
        },
        {
            event: 'endSequence',
            stage: 'standard',
            guard: ({ workspace, context }) =>
                renderIfRegularOrIfHackedIntro(workspace) && matchSequence(context, 'fig'),
            action: noaction
        },
        {
            event: 'inlineGraft',
            stage: 'standard',
            guard: ({ workspace, context }) =>
                renderIfRegularOrIfHackedIntro(workspace) && matchElement(context, 'fig'),
            action: (environment) => {
                const { context } = environment;
                const element = getElement(context);
                const graftRecord: RenderElement = {
                    type: element.type,
                    subType: element.subType,
                    sequence: {},
                    atts: {},
                    text: ''
                };

                renderGraftedSequence(environment, graftRecord.sequence);
            }
        },
        {
            event: 'startWrapper',
            stage: 'standard',
            guard: ({ context, workspace }) =>
                renderIfRegularOrIfHackedIntro(workspace) && matchElement(context, 'usfm:fig'),
            action: ({ context, workspace }) => {
                const srcFromAtts = extractFigureSource(getElement(context));
                if (srcFromAtts && shouldShowImage(workspace)) {
                    terminatePhrase(workspace);
                    const { imageBlockDiv, mappedSource } = createIllustrationBlock(
                        workspace,
                        srcFromAtts,
                        null
                    );
                    workspace.scopeManager.push('wrapper:figure', imageBlockDiv);
                    checkImageExists(mappedSource, imageBlockDiv);
                }
            }
        },
        {
            event: 'endWrapper',
            stage: 'standard',
            guard: ({ context, workspace }) =>
                renderIfRegularOrIfHackedIntro(workspace) && matchElement(context, 'usfm:fig'),
            action: ({ workspace }) => {
                if (shouldShowImage(workspace)) {
                    workspace.scopeManager.promoteContent('wrapper:figure');
                }
            }
        },
        {
            event: 'text',
            stage: 'standard',
            guard: ({ workspace }) =>
                !workspace.scratch.text?.empty &&
                renderIfRegularOrIfHackedIntro(workspace) &&
                !!workspace.scopeManager.find('wrapper:figure'),
            action({ workspace }) {
                const text: string = workspace.scratch.text!.cleanedText!;
                // This is a HACK!
                // see https://github.com/Proskomma/proskomma-json-tools/issues/63
                if (text !== 'NO_CAPTION') {
                    const divFigureText = createIllustrationCaptionBlock(text);
                    workspace.scopeManager.appendContent(divFigureText, 'wrapper:figure');
                }
            }
        },
        {
            event: 'endDocument',
            stage: 'standard',
            action({ workspace }) {
                if (!workspace.hackRenderIntro) {
                    if (showImage(workspace)) {
                        addIllustrations(workspace);
                    }
                }
            }
        }
    ],
    'Illustrations'
);

export function createIllustrationBlock(
    workspace: Pick<RenderWorkspace, 'document' | 'config'>,
    source: string,
    caption: string | null
) {
    const mappedSource = illustrationFiles['./' + source] ?? '';

    const imageBlockDiv = workspace.document.createElement('div');
    imageBlockDiv.classList.add('image-block');

    const imageSpan = workspace.document.createElement('span');
    imageSpan.classList.add('image');

    const img = document.createElement('img');
    img.setAttribute('src', mappedSource);
    img.style.display = 'inline-block';
    if (workspace.config.mainFeatures['zoom-illustrations']) {
        img.addEventListener('click', () => showFullscreenPopup(mappedSource));
    }

    imageSpan.appendChild(img);
    imageBlockDiv.appendChild(imageSpan);
    if (caption) {
        const divFigureText = createIllustrationCaptionBlock(caption);
        imageBlockDiv.appendChild(divFigureText);
    }
    return { imageBlockDiv, mappedSource };
}

function createIllustrationCaptionBlock(caption: string) {
    const captionDiv = document.createElement('div');
    captionDiv.classList.add('caption');

    const captionSpan = document.createElement('span');
    captionSpan.classList.add('caption');
    captionSpan.innerText = caption;

    captionDiv.append(captionSpan);
    return captionDiv;
}

function extractFigureSource(element: RenderElement) {
    let source = '';
    if ('src' in element.atts) {
        source = element.atts['src'][0];
    } else if ('unknownDefault_fig' in element.atts) {
        source = element.atts['unknownDefault_fig'][0];
    }
    return source;
}

function shouldShowImage(workspace: RenderWorkspace) {
    return (
        workspace.viewSettings.illustrations &&
        (!isBibleBook(workspace.stores.references) ||
            workspace.viewSettings.bibleImages === 'normal')
    );
}

async function checkImageExists(src: string, div: HTMLElement) {
    try {
        const response = await fetch(src, { method: 'HEAD' });

        if (!response.ok) {
            // The file does not exist
            div.style.display = 'none';
        }
    } catch (error) {
        // An error occurred (e.g., network error)
        console.error('Error checking image existence:', error);
    }
}

function showFullscreenPopup(imageSource: string) {
    // Create the fullscreen popup div
    const fullscreenDiv = document.createElement('div');
    fullscreenDiv.classList.add('fullscreen-popup');

    const fullscreenImg = document.createElement('img');
    fullscreenImg.setAttribute('src', imageSource);

    const closeButton = document.createElement('button');
    closeButton.classList.add('close-btn');
    closeButton.addEventListener('click', () => {
        document.body.removeChild(fullscreenDiv);
    });

    fullscreenDiv.appendChild(fullscreenImg);
    fullscreenDiv.appendChild(closeButton);

    document.body.appendChild(fullscreenDiv);
}

function showImage(workspace: RenderWorkspace) {
    return workspace.viewSettings.illustrations && showImageInBook(workspace);
}
function showImageInBook(workspace: RenderWorkspace) {
    const showBibleImage = workspace.viewSettings.bibleImages === 'normal';
    const showImages = !workspace.viewSettings.isBibleBook || showBibleImage;
    return showImages;
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
