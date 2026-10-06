import {
    FeatureSpec,
    renderIfRegularOrIfHackedIntro,
    type RenderEnvironment
} from '$lib/render-sofria/common';
import { terminatePhrase } from '../text';
import { usfmType } from './common';
import { figures } from './figures';
import { glossary } from './glossary';
import { jmplinks } from './jmplinks';

function shouldAddWrapper({ context, workspace }: RenderEnvironment) {
    const type = usfmType(context);
    return (
        renderIfRegularOrIfHackedIntro(workspace) &&
        !!type &&
        // if glossary words are disabled, render as a normal wrapper with class 'w'
        (!isGlossaryWrapper(type) || !workspace.viewSettings.glossaryWords) &&
        // don't bother adding a wrapper if it's words of Jesus and red-letters are disabled
        (!isWordsOfJesusWrapper(type) || workspace.viewSettings.redLetters)
    );
}

function isWordsOfJesusWrapper(usfmType: string) {
    return usfmType === 'wj';
}

export const usfmWrappers = new FeatureSpec([
    {
        event: 'startWrapper',
        section: 'fallback',
        guard: shouldAddWrapper,
        action: ({ context, workspace }) => {
            const usfmWrapperType = usfmType(context);

            const spanElement = workspace.document.createElement('span');
            spanElement.classList.add(usfmWrapperType);
            workspace.scopeManager.push(`wrapper:${usfmWrapperType}`, spanElement);
        }
    },
    {
        event: 'endWrapper',
        section: 'fallback',
        guard: shouldAddWrapper,
        action: ({ context, workspace }) => {
            terminatePhrase(workspace);

            workspace.scopeManager.promoteContent(`wrapper:${usfmType(context)}`);
        }
    }
]);

export { figures, glossary, jmplinks };
