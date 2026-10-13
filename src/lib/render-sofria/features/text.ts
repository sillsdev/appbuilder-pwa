import { addToScratchPad, FeatureSpec, renderIfRegularOrIfHackedIntro } from '../common';
import { extractClassName, getBlock, getElement, matchSequence } from './common';
import { addPhrases, terminatePhrase, type SharedTextScratch } from './common/text';

export const text = new FeatureSpec<SharedTextScratch>('Default', [
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
        action({ workspace }) {
            addPhrases(workspace, workspace.scratch.text!.cleanedText!);
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
            if (matchSequence(context, 'main')) {
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
