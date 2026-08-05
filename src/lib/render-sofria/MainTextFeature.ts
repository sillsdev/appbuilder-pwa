import { FeatureSpec, RenderScope, RenderScopeLevel, type RenderEnvironment } from './common';

const mainTextFeature = new FeatureSpec([
    {
        eventTriggers: ['startParagraph'],
        action({ context, workspace }: RenderEnvironment) {
            if (context.sequences[0].type === 'main') {
                // Render main text
                const paraClass =
                    context.sequences[0].block.subType.split(':')[1] ||
                    context.sequences[0].block.subType;

                const paragraphDiv = workspace.scopeManager.getActiveContentRoot(
                    RenderScopeLevel.paragraph
                );
                paragraphDiv.classList.add(paraClass);
                if (paraClass === 'b') {
                    paragraphDiv.innerHTML += '&nbsp;';
                }
            }
            // workspace.scopes.push(new RenderScope(workspace.document, RenderScopeLevel.phrase));
        }
    },
    {
        eventTriggers: ['text'],
        action({ context, workspace }: RenderEnvironment) {
            const text = context.sequences[0].element.text;
            const textDiv = workspace.document.createElement('div');
            textDiv.innerText = text;
            this.output = textDiv;
        }
    },
    {
        eventTriggers: ['endParagraph'],
        action({ context, workspace }: RenderEnvironment) {
            if (context.sequences[0].type === 'main') {
                // Render main text
            }
        }
    }
]);

export default mainTextFeature;
