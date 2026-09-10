import { scriptureConfig } from '$assets/config';
import { addToScratchPad, FeatureSpec, type RenderWorkspace } from '$lib/render-sofria/common';
import { isBibleBook } from '$lib/scripts/scripture-reference-utils';
import type { RenderElement } from 'proskomma-json-tools';
import { usfmType } from './common';

const illustrations = import.meta.glob('./*', {
    import: 'default',
    eager: true,
    query: '?url',
    base: '/src/gen-assets/illustrations'
}) as Record<string, string>;

export function isFigureWrapper(usfmType: string) {
    return usfmType === 'fig';
}

export const figures = new FeatureSpec<{ wrapper: { figureDiv?: HTMLDivElement } }>([
    {
        eventTriggers: ['startWrapper'],
        guard: ({ context }) => isFigureWrapper(usfmType(context)),
        action: ({ context, workspace }) => {
            if (workspace.logSettings.wrapper) {
                console.log('Start Wrapper %o', context.sequences[0].element);
            }
            const srcFromAtts = extractFigureSource(context.sequences[0].element);
            if (srcFromAtts) {
                /* 
                // TODO: I think this is here to make sure the current text is properly appended
                // Need to figure out if this is still necessary...
                if (workspace.phraseDiv != null && workspace.phraseDiv.innerText !== '') {
                    appendPhrase(workspace);
                }
                workspace.phraseDiv = null; */
                const { imageBlockDiv, mappedSource } = createIllustrationBlock(
                    workspace,
                    srcFromAtts,
                    null
                );
                addToScratchPad(workspace.scratch, 'wrapper', { figureDiv: imageBlockDiv });
                if (shouldShowImage(workspace)) {
                    checkImageExists(mappedSource, imageBlockDiv);
                }
            }
        }
    },
    {
        eventTriggers: ['endWrapper'],
        guard: ({ context }) => isFigureWrapper(usfmType(context)),
        action: ({ context, workspace }) => {
            if (workspace.logSettings.wrapper) {
                console.log('End Wrapper %o', context.sequences[0].element);
            }
            if (shouldShowImage(workspace) && workspace.scratch.wrapper.figureDiv) {
                workspace.scopeManager.appendInnerContent(
                    workspace.scratch.wrapper.figureDiv,
                    'paragraph'
                );
                addToScratchPad(workspace.scratch, 'wrapper', { figureDiv: undefined });
            }
        }
    }
]);

export function createIllustrationBlock(
    workspace: Pick<RenderWorkspace, 'document'>,
    source: string,
    caption: string | null
) {
    const mappedSource = illustrations['./' + source] ?? '';

    const imageBlockDiv = workspace.document.createElement('div');
    imageBlockDiv.classList.add('image-block');

    const imageSpan = workspace.document.createElement('span');
    imageSpan.classList.add('image');

    const img = document.createElement('img');
    img.setAttribute('src', mappedSource);
    img.style.display = 'inline-block';
    if (scriptureConfig.mainFeatures['zoom-illustrations']) {
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

export function createIllustrationCaptionBlock(caption: string) {
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
        workspace.viewShowIllustrations &&
        (!isBibleBook(workspace.references) || workspace.viewShowBibleImages === 'normal')
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
