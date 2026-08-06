import { FeatureSpec, RenderScope, RenderScopeLevel, type RenderEnvironment } from './common';
import { createLetterIndex, subdividePhrases } from './util';

const mainTextFeature = new FeatureSpec([
    {
        eventTriggers: ['startParagraph'],
        action({ context, workspace }: RenderEnvironment) {
            if (context.sequences[0].type === 'main') {
                workspace.sequenceTypes.push('main');
                // Render main text
                const paraClass =
                    context.sequences[0].block.subType.split(':')[1] ||
                    context.sequences[0].block.subType;

                const paragraphDiv = workspace.document.createElement('div');
                paragraphDiv.classList.add(paraClass);
                if (paraClass === 'b') {
                    paragraphDiv.innerHTML += '&nbsp;';
                }

                workspace.scopeManager.addScope(RenderScopeLevel.paragraph, paragraphDiv);
            }
            // workspace.scopes.push(new RenderScope(workspace.document, RenderScopeLevel.phrase));
        }
    },
    {
        eventTriggers: ['text'],
        action({ context, workspace }: RenderEnvironment) {
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
                console.log('Adding text:', text);
            }

            const textDiv = workspace.document.createElement('div');

            const phrases = subdividePhrases(workspace, text);
            for (const phrase of phrases) {
                const phraseDiv = workspace.document.createElement('div');
                const phraseIndex = createLetterIndex(workspace.currentTextPosition.phraseIndex);

                phraseDiv.id = workspace.currentTextPosition.verse + phraseIndex;
                phraseDiv.setAttribute('data-verse', workspace.currentTextPosition.verse);
                phraseDiv.setAttribute('data-phrase', phraseIndex);
                phraseDiv.classList.add('txs', 'seltxt', 'scroll-item');
                phraseDiv.innerHTML += phrase;

                textDiv.appendChild(phraseDiv);

                workspace.currentTextPosition.phraseIndex++;
            }

            // textDiv.innerText = text;
            workspace.scopeManager.appendInnerContent(textDiv);
        }
    },
    {
        eventTriggers: ['endParagraph'],
        action({ context, workspace }: RenderEnvironment) {
            if (context.sequences[0].type === 'main') {
                workspace.scopeManager.promoteContent();
                if (workspace.sequenceTypes.at(-1) === 'main') {
                    workspace.sequenceTypes.pop();
                } else {
                    throw new Error(`Unbalanced sequence type ${workspace.sequenceTypes.at(-1)}`);
                }
            }
        }
    }
]);

export default mainTextFeature;
