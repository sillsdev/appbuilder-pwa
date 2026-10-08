import {
    addToScratchPad,
    FeatureSpec,
    renderIfRegularOrIfHackedIntro,
    type RenderEnvironment
} from '$lib/render-sofria/common';
import { extractUSFMClassName, matchElement } from './common';
import { addPhrases, terminatePhrase, type SharedTextScratch } from './common/text';

function shouldAddWrapper({ context, workspace }: RenderEnvironment) {
    return (
        renderIfRegularOrIfHackedIntro(workspace) &&
        !!extractUSFMClassName(context) &&
        // don't bother adding a wrapper if it's words of Jesus and red-letters are disabled
        (!matchElement(context, 'usfm:wj') || workspace.viewSettings.redLetters)
    );
}

export const usfmWrappers = new FeatureSpec<
    { wrapper?: { typeStack?: string[] } } & SharedTextScratch
>([
    {
        event: 'startWrapper',
        stage: 'fallback',
        guard: shouldAddWrapper,
        action: ({ context, workspace }) => {
            const usfmWrapperType = extractUSFMClassName(context);

            const spanElement = workspace.document.createElement('span');
            spanElement.classList.add(usfmWrapperType);
            workspace.scopeManager.push(`wrapper:${usfmWrapperType}`, spanElement);

            const typeStack = workspace.scratch.wrapper?.typeStack ?? [];
            typeStack.push(usfmWrapperType);
            addToScratchPad(workspace.scratch, 'wrapper', { typeStack });
        }
    },
    {
        event: 'endWrapper',
        stage: 'fallback',
        guard: shouldAddWrapper,
        action: ({ context, workspace }) => {
            terminatePhrase(workspace);

            workspace.scopeManager.promoteContent(`wrapper:${extractUSFMClassName(context)}`);

            const typeStack = workspace.scratch.wrapper?.typeStack ?? [];
            typeStack.pop();
            addToScratchPad(workspace.scratch, 'wrapper', { typeStack });
        }
    },
    {
        event: 'text',
        stage: 'standard',
        details: ({ workspace }) => workspace.scratch.text?.cleanedText,
        guard: ({ workspace }) =>
            !workspace.scratch.text?.empty &&
            !!workspace.scopeManager.find(
                `wrapper:${workspace.scratch.wrapper?.typeStack?.at(-1)}`
            ),
        action({ workspace }) {
            addPhrases(workspace, workspace.scratch.text!.cleanedText!, {
                requireTop: true,
                newPhrase: false
            });
        }
    }
]);
