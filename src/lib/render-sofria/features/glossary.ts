import { FeatureSpec, renderIfRegularOrIfHackedIntro } from '$lib/render-sofria/common';
import { ciEquals } from '$lib/scripts/stringUtils';
import { getElement, matchElement } from './common';
import { addPhrases, type SharedTextScratch } from './common/text';

// if glossary words are disabled, glossary wrappers will be handled in usfmWrappers in ../index.ts
export const glossary = new FeatureSpec<SharedTextScratch>(
    [
        {
            event: 'startWrapper',
            stage: 'standard',
            details: ({ context }) => ({ lemma: getElement(context).atts['lemma'] }),
            guard: ({ context, workspace }) =>
                matchElement(context, 'usfm:w') && renderIfRegularOrIfHackedIntro(workspace),
            action: ({ context, workspace }) => {
                const a = workspace.document.createElement('a');
                a.setAttribute('data-match', getElement(context).atts['lemma']?.[0] ?? '');
                a.setAttribute('href', 'javascript:void(0)');
                workspace.scopeManager.push('wrapper:glossary', a);
            }
        },
        {
            event: 'text',
            stage: 'standard',
            details: ({ workspace }) => workspace.scratch.text?.cleanedText,
            guard: ({ workspace }) =>
                !workspace.scratch.text?.empty && !!workspace.scopeManager.find('wrapper:glossary'),
            action({ workspace }) {
                addPhrases(workspace, workspace.scratch.text!.cleanedText!, {
                    requireTop: true,
                    newPhrase: false
                });
            }
        },
        {
            event: 'endWrapper',
            stage: 'standard',
            details: ({ context }) => ({ lemma: getElement(context).atts['lemma'] }),
            guard: ({ context, workspace }) =>
                matchElement(context, 'usfm:w') && renderIfRegularOrIfHackedIntro(workspace),
            action: ({ workspace }) => {
                const a = workspace.scopeManager.pop('wrapper:glossary').root;

                const matchWord = a.getAttribute('data-match') || a.innerText || '';
                a.setAttribute('data-match', matchWord.trim());

                const span = workspace.document.createElement('span');
                span.classList.add('glossary');
                span.appendChild(a);

                workspace.scopeManager.appendContent(span);
            }
        },
        {
            event: 'endDocument',
            stage: 'standard',
            action({ workspace }) {
                workspace.root.querySelectorAll('span.glossary').forEach((el) => {
                    el.addEventListener('click', (e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        const glossaryLink = el
                            .querySelector('[data-match]')
                            ?.getAttribute('data-match');
                        workspace.queries.glossary.then((glossaryResults) => {
                            if (glossaryResults.data.docSets[0].document) {
                                glossaryResults.data.docSets[0].document.mainBlocks.forEach(
                                    (block) => {
                                        if (ciEquals(block.key, glossaryLink)) {
                                            workspace.events.openGlossary(glossaryLink!, block);
                                        }
                                    }
                                );
                            }
                        });
                    });
                });
            }
        }
    ],
    'Glossary',
    { tag: 'glossary-words', enabledValue: 'true' }
);
