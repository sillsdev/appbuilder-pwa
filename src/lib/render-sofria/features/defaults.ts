import { deselectAllElements } from '$lib/scripts/verseSelectUtil';
import {
    addToScratchPad,
    FeatureSpec,
    renderIfRegularOrIfHackedIntro,
    type RenderWorkspace
} from '../common';
import { getElement } from './common';
import { terminatePhrase, type SharedTextScratch } from './common/text';

export const defaults = new FeatureSpec<SharedTextScratch>('Default', {
    startDocument: {
        stage: 'fallback',
        details: ({ workspace }) => ({ ...workspace.stores.references }),
        action({ workspace }) {
            const baseDiv = workspace.document.createElement('div');
            baseDiv.setAttribute('data-verse', 'start');
            baseDiv.setAttribute('data-phrase', 'none');
            deselectAllElements(workspace.root);
            workspace.root.appendChild(baseDiv);
            workspace.scopeManager.push('document', workspace.root);
        }
    },
    endDocument: {
        stage: 'cleanup',
        details: ({ workspace }) => ({ ...workspace.stores.references }),
        action({ workspace, output }) {
            addFooter(workspace);

            workspace.scopeManager.pop('document');
            output.root = workspace.root;
        }
    },
    endVerses: [
        {
            stage: 'init',
            details: ({ context, workspace }) => ({
                v: getElement(context).atts['number'],
                phrase: workspace.scopeManager.find('phrase')?.root.textContent
            }),
            guard: ({ workspace }) => renderIfRegularOrIfHackedIntro(workspace),
            action({ workspace }) {
                terminatePhrase(workspace);
            }
        },
        {
            stage: 'cleanup',
            details: ({ context }) => ({
                v: getElement(context).atts['number']
            }),
            guard: ({ workspace }) => renderIfRegularOrIfHackedIntro(workspace),
            action({ workspace }) {
                workspace.currentTextPosition.verse = 'none';
            }
        }
    ],
    startParagraph: {
        stage: 'init',
        details: ({ workspace }) => ({
            phrase: workspace.scopeManager.find('phrase')?.root.textContent
        }),
        guard: ({ workspace }) => renderIfRegularOrIfHackedIntro(workspace),
        action({ workspace }) {
            terminatePhrase(workspace);
        }
    },
    endParagraph: {
        stage: 'init',
        details: ({ workspace }) => ({
            phrase: workspace.scopeManager.find('phrase')?.root.textContent
        }),
        guard: ({ workspace }) => renderIfRegularOrIfHackedIntro(workspace),
        action({ workspace }) {
            terminatePhrase(workspace);
        }
    },
    text: [
        {
            stage: 'init',
            details: ({ context }) => ({ length: getElement(context).text.trim().length }),
            guard: ({ workspace }) => renderIfRegularOrIfHackedIntro(workspace),
            action({ context, workspace }) {
                let cleanedText = getElement(context).text;

                // Next line is a HACK: Proskomma adds default="" to anonymous bars in text
                // See https://community.scripture.software.sil.org/t/issues-with-cross-references-in-pwa-modern/4476
                cleanedText = cleanedText.replaceAll(
                    /(\|\s*)default="([^"]*)"/g,
                    (_m, bar, quoted) => ` ${bar}${quoted}`
                );

                addToScratchPad(workspace.scratch, 'text', {
                    cleanedText,
                    empty: !cleanedText.trim().length
                });
            }
        },
        {
            stage: 'cleanup',
            details: () => undefined,
            guard: ({ workspace }) => renderIfRegularOrIfHackedIntro(workspace),
            action({ workspace }) {
                addToScratchPad(workspace.scratch, 'text', {
                    cleanedText: undefined,
                    empty: undefined
                });
            }
        }
    ]
});

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
