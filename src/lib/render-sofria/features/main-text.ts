import { FeatureSpec, noaction, renderIfRegularOrIfHackedIntro } from '../common';
import { extractClassName, getBlock, getElement, getSequence, matchSequence } from './common';
import { addPhrases, getPhraseDiv, terminatePhrase, type SharedTextScratch } from './common/text';

export const text = new FeatureSpec<SharedTextScratch>('Main Text', {
    startSequence: {
        stage: 'standard',
        details: ({ context }) => ({ type: getSequence(context).type }),
        guard: ({ context, workspace }) =>
            matchSequence(context, 'main') && renderIfRegularOrIfHackedIntro(workspace),
        action: noaction
    },
    endSequence: {
        stage: 'standard',
        details: ({ context }) => ({ type: getSequence(context).type }),
        guard: ({ context, workspace }) =>
            matchSequence(context, 'main') && renderIfRegularOrIfHackedIntro(workspace),
        action: noaction
    },
    startVerses: {
        stage: 'fallback',
        details: ({ context }) => ({ v: getElement(context).atts['number'] }),
        guard: ({ workspace }) => renderIfRegularOrIfHackedIntro(workspace),
        action({ context, workspace }) {
            const verse = getElement(context).atts['number'];
            workspace.currentTextPosition.verse = verse;
            workspace.currentTextPosition.phraseIndex = 0;

            const verseDiv = workspace.document.createElement('div');
            verseDiv.setAttribute('data-verse', verse);

            if (workspace.viewSettings.verseLayout === 'one-per-line') {
                verseDiv.classList.add('verse-block');
            } else {
                verseDiv.classList.add('txs');
            }

            workspace.scopeManager.push(`verses:${verse}`, verseDiv);
        }
    },
    startParagraph: {
        stage: 'standard',
        details: ({ context }) => ({ class: extractClassName(getBlock(context)) }),
        guard: ({ context, workspace }) =>
            matchSequence(context, 'main') && renderIfRegularOrIfHackedIntro(workspace),
        action({ context, workspace }) {
            const paraClass = extractClassName(getBlock(context));
            const paragraphDiv = workspace.document.createElement('div');
            paragraphDiv.classList.add(paraClass);
            if (paraClass === 'b') {
                paragraphDiv.innerHTML += '&nbsp;';
            }

            workspace.scopeManager.push('paragraph:main', paragraphDiv);
        }
    },
    endParagraph: {
        stage: 'standard',
        details: ({ context, workspace }) => ({
            class: extractClassName(getBlock(context)),
            render: workspace.currentTextPosition.render
        }),
        guard: ({ context, workspace }) =>
            matchSequence(context, 'main') && renderIfRegularOrIfHackedIntro(workspace),
        action({ workspace }) {
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
                        const el = workspace.scopeManager.at(0).root.querySelector('[data-verse]');
                        const verse = el?.getAttribute('data-verse');
                        const verseDiv =
                            verse && verse !== 'none'
                                ? workspace.scopeManager
                                      .at(1)
                                      .root.querySelector(`[data-verse="${verse}"]`)
                                : null;
                        const paragraphDiv = workspace.scopeManager.pop('paragraph:main').root;
                        // render is set to true by verse right before start of verse range
                        // endVerse event for this verse is not sent until after paragraph ends
                        if (workspace.currentTextPosition.render) {
                            if (verseDiv) {
                                verseDiv.appendChild(paragraphDiv);
                            } else {
                                workspace.scopeManager.appendContent(paragraphDiv);
                            }
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
                        // render is set to true by verse right before start of verse range
                        // endVerse event for this verse is not sent until after paragraph ends
                        if (workspace.currentTextPosition.render) {
                            workspace.scopeManager.appendContent(verseDiv);
                        }
                    }
                    break;
                // multiple verses in one paragraph
                default:
                    {
                        const divs: HTMLElement[] = [];
                        for (let i = 0; i < depth; i++) {
                            const verseDiv = workspace.scopeManager.pop('verses').root;
                            const verse = verseDiv.getAttribute('data-verse')!;
                            const range = parseVerseRange(verse);
                            // filter out verses not in range
                            if (
                                !workspace.viewSettings.verseRange ||
                                ((range.start >= workspace.viewSettings.verseRange.start ||
                                    range.end >= workspace.viewSettings.verseRange.start) &&
                                    (range.end <= workspace.viewSettings.verseRange.end ||
                                        range.start <= workspace.viewSettings.verseRange.end))
                            ) {
                                divs.push(verseDiv);
                            }
                        }
                        if (divs.length) {
                            const count = divs.length;
                            for (let i = 0; i < count; i++) {
                                workspace.scopeManager.appendContent(divs.pop()!);
                            }
                            workspace.scopeManager.promoteContent('paragraph:main');
                        } else {
                            workspace.scopeManager.pop('paragraph:main');
                        }
                    }
                    break;
            }
        }
    },
    text: [
        {
            stage: 'standard',
            name: 'ChordPro chords',
            details: ({ workspace }) => workspace.scratch.text?.cleanedText,
            guard: ({ workspace }) =>
                !workspace.scratch.text?.empty &&
                renderIfRegularOrIfHackedIntro(workspace) &&
                workspace.stores.references.sourceFormat === 'chordpro' &&
                /\[[^\]]+\]/.test(workspace.scratch.text!.cleanedText!),
            action({ workspace }) {
                terminatePhrase(workspace);
                const parts = workspace.scratch.text!.cleanedText!.split('[');

                const phraseDiv = getPhraseDiv(workspace);
                for (let i = 0; i < parts.length; i++) {
                    if (parts[i].includes(']')) {
                        const prefix = parts[i - 1]?.at(-1) === ' ' ? ' ' : '';
                        const [chord, first, ...words] = parts[i].split(/\]| /);
                        const ruby = workspace.document.createElement('ruby');
                        ruby.append(prefix + first);
                        ruby.classList.add('chord');

                        const rt = workspace.document.createElement('rt');
                        rt.append(chord);
                        ruby.append(rt);

                        phraseDiv.append(ruby);
                        phraseDiv.append((words.length ? prefix : '') + words.join(' '));
                    } else {
                        phraseDiv.append(parts[i]);
                    }
                }
                workspace.scopeManager.appendContent(phraseDiv);
            }
        },
        {
            stage: 'fallback',
            details: ({ workspace }) => workspace.scratch.text?.cleanedText,
            guard: ({ workspace }) =>
                !workspace.scratch.text?.empty && renderIfRegularOrIfHackedIntro(workspace),
            action({ workspace }) {
                addPhrases(workspace, workspace.scratch.text!.cleanedText!);
            }
        }
    ],
    endDocument: {
        stage: 'standard',
        action({ workspace }) {
            workspace.root.querySelectorAll('.seltxt').forEach((el) => {
                el.addEventListener('click', (e) => workspace.events.clickText(e as MouseEvent));
            });
        }
    }
});
