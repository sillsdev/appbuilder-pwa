import { getFeatureValueBoolean, getFeatureValueString } from '$lib/scripts/configUtils';
import { generateHTML } from '$lib/scripts/scripture-reference-utils';
import {
    addToScratchPad,
    FeatureSpec,
    renderIfRegularOrIfHackedIntro,
    type RenderWorkspace
} from '../common';
import { createLetterIndex } from '../util';
import { extractClassName, getBlock, getElement, matchBlock, matchSequence } from './common';
import { addPhrases, getPhraseDiv, terminatePhrase, type SharedTextScratch } from './common/text';

export type SharedParaScratch = { paragraph?: { deferredEls?: HTMLElement[] } };

type TextScratch = {
    text?: { footnoteCallerIndex?: number };
} & SharedTextScratch;

export const text = new FeatureSpec<TextScratch & SharedParaScratch>([
    {
        event: 'startParagraph',
        stage: 'init',
        details: ({ workspace }) => ({
            phrase: workspace.scopeManager.find('phrase')?.root.innerText
        }),
        guard: ({ workspace }) => renderIfRegularOrIfHackedIntro(workspace),
        action({ workspace }) {
            terminatePhrase(workspace);
        }
    },
    {
        event: 'startParagraph',
        stage: 'fallback',
        details: ({ context }) => ({ class: extractClassName(getBlock(context)) }),
        guard: ({ workspace }) => renderIfRegularOrIfHackedIntro(workspace),
        action({ context, workspace }) {
            const paraClass = extractClassName(getBlock(context));
            if (matchSequence(context, 'main') && !workspace.hackRenderIntro) {
                const paragraphDiv = workspace.document.createElement('div');
                paragraphDiv.classList.add(paraClass);
                if (paraClass === 'b') {
                    paragraphDiv.innerHTML += '&nbsp;';
                }

                workspace.scopeManager.push('paragraph:main', paragraphDiv);
            }
        }
    },
    {
        event: 'text',
        stage: 'init',
        details: ({ context }) => ({ length: getElement(context).text.trim().length }),
        guard: ({ workspace }) => renderIfRegularOrIfHackedIntro(workspace),
        action({ context, workspace }) {
            let cleanedText = getElement(context).text;

            // Next line is a HACK: Proskomma adds default="" to anonymous bars in text
            // See https://community.scripture.software.sil.org/t/issues-with-cross-references-in-pwa-modern/4476
            cleanedText = cleanedText.replaceAll('|default=""', '| ');

            addToScratchPad(workspace.scratch, 'text', {
                cleanedText,
                empty: !cleanedText.trim().length
            });
        }
    },
    {
        event: 'text',
        stage: 'cleanup',
        details: () => undefined,
        guard: ({ workspace }) => renderIfRegularOrIfHackedIntro(workspace),
        action({ workspace }) {
            addToScratchPad(workspace.scratch, 'text', {
                cleanedText: undefined,
                empty: undefined
            });
        }
    },
    {
        event: 'text',
        stage: 'fallback',
        details: ({ workspace }) => workspace.scratch.text?.cleanedText,
        guard: ({ workspace }) =>
            !workspace.scratch.text?.empty && renderIfRegularOrIfHackedIntro(workspace),
        action({ context, workspace }) {
            const text: string = workspace.scratch.text!.cleanedText!;
            if (matchBlock(context, 'usfm:x')) {
                addGraftText(workspace, text, 'crossref');
            } else if (matchBlock(context, 'usfm:f')) {
                addGraftText(workspace, text, 'footnote');
            } else if (matchBlock(context, 'usfm:tr')) {
                if (workspace.scopeManager.find('wrapper:cell')) {
                    if (workspace.scopeManager.find('wrapper:xt')) {
                        const references = text.split('; ');
                        for (let i = 0; i < references.length; i++) {
                            const spanV = document.createElement('span');
                            spanV.classList.add('reflink');
                            const refText = generateHTML(text, 'header-ref');
                            spanV.innerHTML = refText;
                            // TODO spanV.addEventListener('click', onClick, false);
                            workspace.scopeManager.appendContent(spanV);
                            if (i < references.length - 1) {
                                workspace.scopeManager.appendContent(
                                    workspace.document.createTextNode('; ')
                                );
                            }
                        }
                    } else {
                        workspace.scopeManager.appendContent(
                            workspace.document.createTextNode(text)
                        );
                    }
                }
            } else if (workspace.scopeManager.find('wrapper:xt')) {
                const spanV = document.createElement('span');
                spanV.classList.add('reflink');
                const refText = generateHTML(text, 'header-ref');
                spanV.innerHTML = refText;
                const phraseDiv = getPhraseDiv(workspace);
                phraseDiv.appendChild(spanV);
                workspace.scopeManager.push('phrase', phraseDiv);
            }
            // jmp, audioc, reflink, and everything else
            else {
                addPhrases(workspace, text);
            }
        }
    },
    {
        event: 'endParagraph',
        stage: 'init',
        details: ({ workspace }) => ({
            phrase: workspace.scopeManager.find('phrase')?.root.innerText
        }),
        guard: ({ workspace }) => renderIfRegularOrIfHackedIntro(workspace),
        action({ workspace }) {
            terminatePhrase(workspace);
        }
    },
    {
        event: 'endParagraph',
        stage: 'fallback',
        details: ({ context }) => ({ class: extractClassName(getBlock(context)) }),
        guard: ({ workspace }) => renderIfRegularOrIfHackedIntro(workspace),
        action({ context, workspace }) {
            if (matchSequence(context, 'main') && !workspace.hackRenderIntro) {
                workspace.scratch.paragraph?.deferredEls?.forEach((el) =>
                    workspace.scopeManager.appendContent(el, 'paragraph:main')
                );
                addToScratchPad(workspace.scratch, 'paragraph', { deferredEls: [] });

                /**
                 * The goal of this code, and its counterpart in `startVerses` is to create a single `div` to hold a full verse.
                 * This is necessary to efficiently implement Issue [#1115](https://github.com/sillsdev/appbuilder-pwa/issues/1115).
                 *
                 * A verse `div`, and corresponding scope, is created in `startVerses`, but this could have happened in a separate paragraph, or there may be multiple such verse scopes on top of this paragraph.
                 *
                 * If the current paragraph is at the top of the scope stack (depth = 0), then the verse div is located elsewhere in the context, most likely appended as content to the scope before the current paragraph.
                 * In this case, we want to locate the pre-existing verse div, and attach the current paragraph to it.
                 *
                 * If there is one and only one verse (depth = 1), then we want to wrap the current paragraph in the verse div.
                 * This could also feed into a future paragraph with depth 0 that would be handled as above.
                 *
                 * If there are more than one verses in the scope (depth > 1), then we just want to append all of them to the current paragraph.
                 *
                 * This may run into issues if there is a paragraph with only one verse, but that verse is continued in a following paragraph, with more than one verse.
                 * Under the current code, if this scenario is encountered, there shouldn't be any errors, but the resulting div structure may be undesirable.
                 */
                const depth = workspace.scopeManager.depth('paragraph:main');
                switch (depth) {
                    // continuation of preexisting verse...
                    case 0:
                        {
                            const el = workspace.scopeManager
                                .at(0)
                                .root.querySelector('[data-verse]');
                            const verse = el?.getAttribute('data-verse');
                            const verseDiv =
                                verse && verse !== 'none'
                                    ? workspace.scopeManager
                                          .at(1)
                                          .root.querySelector(`[data-verse="${verse}"]`)
                                    : null;
                            if (verseDiv) {
                                const paragraphDiv =
                                    workspace.scopeManager.pop('paragraph:main').root;
                                verseDiv.appendChild(paragraphDiv);
                            } else {
                                workspace.scopeManager.promoteContent('paragraph:main');
                            }
                        }
                        break;
                    // wrap paragraph with only one verse in a verse div
                    case 1:
                        {
                            const verseDiv = workspace.scopeManager.pop('verses').root;
                            workspace.scopeManager.appendChildrenFromContainer(verseDiv);
                            const paragraphDiv = workspace.scopeManager.pop('paragraph:main').root;
                            verseDiv.replaceChildren(paragraphDiv);
                            workspace.scopeManager.appendContent(verseDiv);
                        }
                        break;
                    // multiple verses in one paragraph
                    default:
                        {
                            const divs: HTMLElement[] = [];
                            for (let i = 0; i < depth; i++) {
                                divs.push(workspace.scopeManager.pop('verses').root);
                            }
                            for (let i = 0; i < depth; i++) {
                                workspace.scopeManager.appendContent(divs.pop()!);
                            }
                            workspace.scopeManager.promoteContent('paragraph:main');
                        }
                        break;
                }
            }
        }
    }
]);

function addGraftText(workspace: RenderWorkspace, text: string, textType: 'crossref' | 'footnote') {
    const callerRoot = workspace.scopeManager.find('inlineGraft:note_caller')?.root;
    const contentRoot = workspace.scopeManager.find('inlineGraft:footnote')?.root;
    if (callerRoot && contentRoot && callerRoot.getAttribute('data-graft') === contentRoot.id) {
        const sup = callerRoot.querySelector('sup.footnote');
        if (sup && !sup.innerHTML) {
            const caller = getFootnoteCallerCharacter(workspace, text, textType);
            if (!caller) {
                // Do not include the footnote
                workspace.scopeManager.remove('inlineGraft:note_caller');
            } else {
                // Assign the caller to the footnote sup
                // Add space after footnote if there are multiple footnotes.
                // TODO: How do we tell there are multiple???
                sup.innerHTML = caller + '\u00A0';
            }
        } else {
            workspace.scopeManager.appendContent(workspace.document.createTextNode(text));
        }
    }
}

function getFootnoteCallerCharacter(
    workspace: RenderWorkspace<TextScratch>,
    initialCallerSymbol: string,
    footnoteType: 'crossref' | 'footnote'
) {
    const callerType =
        getFeatureValueString(
            workspace.config,
            `${footnoteType}-caller-type`,
            workspace.stores.references.collection,
            workspace.stores.references.book
        ) || 'default';
    const callerNoCallerToAuto = getFeatureValueBoolean(
        workspace.config,
        `${footnoteType}-caller-no-caller-to-auto`,
        workspace.stores.references.collection,
        workspace.stores.references.book
    );

    let callerSymbol: string | null = initialCallerSymbol;

    if (callerType === 'custom-symbol') {
        // Use whatever is specified as the custom symbol, even '-' or '+'
        // This matches native app. Sigh.
        return getFeatureValueString(
            workspace.config,
            `${footnoteType}-caller-symbol`,
            workspace.stores.references.collection,
            workspace.stores.references.book
        );
    } else if (callerType === 'abc') {
        callerSymbol = '+';
    } else if (callerNoCallerToAuto && callerSymbol === '-') {
        callerSymbol = '+';
    }

    if (callerSymbol === '-') {
        return null;
    } else if (callerSymbol === '+') {
        const idx = workspace.scratch.text?.footnoteCallerIndex ?? 0;
        addToScratchPad(workspace.scratch, 'text', { footnoteCallerIndex: idx + 1 });
        return createLetterIndex(idx);
    } else {
        return callerSymbol;
    }
}
