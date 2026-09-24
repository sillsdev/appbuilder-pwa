import {
    FeatureSpec,
    renderIfRegularOrIfHackedIntro,
    type RenderEnvironment
} from '$lib/render-sofria/common';
import { usfmType } from './common';
import { figures } from './figures';
import { glossary, isGlossaryWrapper } from './glossary';
import { jmplinks } from './jmplinks';

function shouldAddWrapper({ context, workspace }: RenderEnvironment) {
    const type = usfmType(context);
    return (
        renderIfRegularOrIfHackedIntro(workspace) &&
        !!type &&
        // if glossary words are disabled, render as a normal wrapper with class 'w'
        (!isGlossaryWrapper(type) || !workspace.viewShowGlossaryWords) &&
        // don't bother adding a wrapper if it's words of Jesus and red-letters are disabled
        (!isWordsOfJesusWrapper(type) || workspace.viewShowRedLetters)
    );
}

function isWordsOfJesusWrapper(usfmType: string) {
    return usfmType === 'wj';
}

export const usfmWrappers = new FeatureSpec([
    {
        event: 'startWrapper',
        default: true,
        guard: shouldAddWrapper,
        action: ({ context, workspace }) => {
            const element = context.sequences[0].element;
            if (workspace.logSettings.wrapper) {
                console.log('Start Wrapper %o', element);
            }

            const usfmWrapperType = usfmType(context);
            workspace.textType.push('usfm');
            workspace.usfmWrapperType = usfmWrapperType;

            const spanElement = workspace.document.createElement('span');
            spanElement.classList.add(usfmWrapperType);
            workspace.scopeManager.push(`wrapper:${usfmWrapperType}`, spanElement);
        }
    },
    {
        event: 'endWrapper',
        default: true,
        guard: shouldAddWrapper,
        action: ({ context, workspace }) => {
            if (workspace.logSettings.wrapper) {
                console.log('End Wrapper %o', context.sequences[0].element);
            }

            workspace.textType.pop();
            workspace.usfmWrapperType = '';

            workspace.scopeManager.promoteContent(`wrapper:${usfmType(context)}`);
        }
    }
]);

export { figures, glossary, jmplinks };
