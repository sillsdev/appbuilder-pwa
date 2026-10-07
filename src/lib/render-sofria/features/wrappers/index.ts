import {
    FeatureSpec,
    renderIfRegularOrIfHackedIntro,
    type RenderEnvironment
} from '$lib/render-sofria/common';
import { getElementUSFMType, matchUSFMElement } from '../common';
import { terminatePhrase } from '../common/text';
import { glossary } from './glossary';
import { jmplinks } from './jmplinks';

function shouldAddWrapper({ context, workspace }: RenderEnvironment) {
    const type = getElementUSFMType(context);
    return (
        renderIfRegularOrIfHackedIntro(workspace) &&
        !!type &&
        // don't bother adding a wrapper if it's words of Jesus and red-letters are disabled
        (!matchUSFMElement(context, 'wj') || workspace.viewSettings.redLetters)
    );
}

export const usfmWrappers = new FeatureSpec([
    {
        event: 'startWrapper',
        stage: 'fallback',
        guard: shouldAddWrapper,
        action: ({ context, workspace }) => {
            const usfmWrapperType = getElementUSFMType(context);

            const spanElement = workspace.document.createElement('span');
            spanElement.classList.add(usfmWrapperType);
            workspace.scopeManager.push(`wrapper:${usfmWrapperType}`, spanElement);
        }
    },
    {
        event: 'endWrapper',
        stage: 'fallback',
        guard: shouldAddWrapper,
        action: ({ context, workspace }) => {
            terminatePhrase(workspace);

            workspace.scopeManager.promoteContent(`wrapper:${getElementUSFMType(context)}`);
        }
    }
]);

export { glossary, jmplinks };
