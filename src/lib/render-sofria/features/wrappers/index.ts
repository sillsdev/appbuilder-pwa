import {
    FeatureSpec,
    renderIfRegularOrIfHackedIntro,
    type RenderEnvironment
} from '$lib/render-sofria/common';
import { extractUSFMClassName, matchElement } from '../common';
import { terminatePhrase } from '../common/text';
import { glossary } from './glossary';
import { jmplinks } from './jmplinks';

function shouldAddWrapper({ context, workspace }: RenderEnvironment) {
    return (
        renderIfRegularOrIfHackedIntro(workspace) &&
        !!extractUSFMClassName(context) &&
        // don't bother adding a wrapper if it's words of Jesus and red-letters are disabled
        (!matchElement(context, 'usfm:wj') || workspace.viewSettings.redLetters)
    );
}

export const usfmWrappers = new FeatureSpec([
    {
        event: 'startWrapper',
        stage: 'fallback',
        guard: shouldAddWrapper,
        action: ({ context, workspace }) => {
            const usfmWrapperType = extractUSFMClassName(context);

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

            workspace.scopeManager.promoteContent(`wrapper:${extractUSFMClassName(context)}`);
        }
    }
]);

export { glossary, jmplinks };
