import {
    addToScratchPad,
    FeatureSpec,
    renderIfRegularOrIfHackedIntro
} from '../common';
import { createLetterIndex, subdividePhrases } from '../util';

export const text = new FeatureSpec<{ paragraph?: { subheadingPrefixes?: string[] } }>([
    {
        eventTriggers: ['startParagraph'],
        guard: ({ workspace }) => renderIfRegularOrIfHackedIntro(workspace),
        action({ context, workspace }) {
            const sequenceType = context.sequences[0].type;
            if (workspace.logSettings.paragraph) {
                console.log('Start Paragraph %o %o', sequenceType, context.sequences[0].block);
            }
            const paraClass =
                context.sequences[0].block.subType?.split(':')[1] ||
                context.sequences[0].block.subType ||
                '';
            if (sequenceType === 'main' && !workspace.hackRenderIntro) {
                workspace.sequenceTypes.push('main');
                const paragraphDiv = workspace.document.createElement('div');
                paragraphDiv.classList.add(paraClass);
                if (paraClass === 'b') {
                    paragraphDiv.innerHTML += '&nbsp;';
                }

                workspace.scopeManager.addScope('paragraph', paragraphDiv);
            } else if (sequenceType === 'introduction') {
                const introductionDiv = workspace.document.createElement('div');
                introductionDiv.classList.add(paraClass);
                workspace.scopeManager.addScope('paragraph', introductionDiv);
            } else if (sequenceType === 'title') {
                const titleDiv = workspace.document.createElement('div');
                titleDiv.classList.add(paraClass);
                workspace.scopeManager.addScope('paragraph', titleDiv);
            } else if (sequenceType === 'heading') {
                const headerDiv = document.createElement('div');
                headerDiv.classList.add(paraClass);

                const prefix = paraClass.replaceAll(/[0-9]/g, '');
                const subheaders = workspace.scratch.paragraph?.subheadingPrefixes ?? [];
                subheaders.push(prefix);
                addToScratchPad(workspace.scratch, 'paragraph', { subheadingPrefixes: subheaders });
                const count = countSubheadingPrefixes(subheaders, prefix);

                headerDiv.id = prefix + count;
                workspace.scopeManager.addScope('paragraph', headerDiv);
            }
        }
    },
    {
        eventTriggers: ['text'],
        guard: ({ workspace }) => renderIfRegularOrIfHackedIntro(workspace),
        action({ context, workspace }) {
            let text: string = context.sequences[0].element.text;

            // Ignore stretches of whitespace
            const onlySpaces = text.trim().length === 0;
            if (onlySpaces) {
                return;
            }

            // Next line is a HACK: Proskomma adds default="" to anonymous bars in text
            // See https://community.scripture.software.sil.org/t/issues-with-cross-references-in-pwa-modern/4476
            text = text === '|default=""' ? '| ' : text;

            if (workspace.logSettings.text) {
                console.log(
                    'Text element: %o %o %o',
                    context.sequences[0].element.type,
                    context.sequences[0].element.text,
                    context.sequences[0].block
                );
                console.log('Text Type: %o', workspace.textType.at(-1));
            }

            const phrases = subdividePhrases(workspace, text);
            for (const phrase of phrases) {
                const phraseDiv = workspace.document.createElement('div');
                const phraseIndex = createLetterIndex(
                    workspace.currentTextPosition.phraseIndex ?? 0
                );

                phraseDiv.id = workspace.currentTextPosition.verse + phraseIndex;
                phraseDiv.setAttribute('data-verse', workspace.currentTextPosition.verse);
                phraseDiv.setAttribute('data-phrase', phraseIndex);
                phraseDiv.classList.add('txs', 'seltxt', 'scroll-item');
                phraseDiv.innerHTML += phrase;

                workspace.scopeManager.appendInnerContent(phraseDiv);
                workspace.currentTextPosition.phraseIndex =
                    (workspace.currentTextPosition.phraseIndex ?? 0) + 1;
            }
        }
    },
    {
        eventTriggers: ['endParagraph'],
        guard: ({ workspace }) => renderIfRegularOrIfHackedIntro(workspace),
        action({ context, workspace }) {
            const sequenceType = context.sequences[0].type;
            if (workspace.logSettings.paragraph) {
                console.log('End Paragraph %o %o', sequenceType, context.sequences[0].block);
            }
            if (sequenceType === 'main' && !workspace.hackRenderIntro) {
                workspace.scopeManager.promoteContent();
                // TODO: videoDiv? verseDiv?
            } else if (sequenceType === 'introduction') {
                workspace.scopeManager.promoteContent();
            } else if (sequenceType === 'title') {
                workspace.scopeManager.promoteContent();
            } else if (sequenceType === 'heading') {
                workspace.scopeManager.promoteContent();
            }
        }
    }
]);

function countSubheadingPrefixes(subHeadings: string[], labelPrefix: string) {
    return subHeadings.reduce(
        (count, subHeading) => (subHeading === labelPrefix ? count + 1 : count),
        0
    );
}
