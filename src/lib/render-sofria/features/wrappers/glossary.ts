import { addToScratchPad, FeatureSpec } from '$lib/render-sofria/common';
import { usfmType } from './common';

export function isGlossaryWrapper(usfmType: string) {
    return usfmType === 'w';
}

// if glossary words are disabled, glossary wrappers will be handled in usfmWrappers in ../index.ts
export const glossary = new FeatureSpec<{ wrapper: { lemma?: string } }>([
    {
        event: 'startWrapper',
        guard: ({ context, workspace }) =>
            isGlossaryWrapper(usfmType(context)) && workspace.viewShowGlossaryWords,
        action: ({ context, workspace }) => {
            const element = context.sequences[0].element;
            if (workspace.logSettings.wrapper) {
                console.log('Start Wrapper %o', element);
            }

            // Glossary - Check for lemma
            addToScratchPad(workspace.scratch, 'wrapper', {
                lemma: element.atts['lemma']?.[0]
            });

            const usfmWrapperType = usfmType(context);
            workspace.textType.push('usfm');
            workspace.usfmWrapperType = usfmWrapperType;

            const spanElement = workspace.document.createElement('span');
            spanElement.classList.add('glossary');
            workspace.scopeManager.addScope('wrapper', spanElement);
        }
    },
    {
        event: 'endWrapper',
        guard: ({ context, workspace }) =>
            isGlossaryWrapper(usfmType(context)) && workspace.viewShowGlossaryWords,
        action: ({ context, workspace }) => {
            if (workspace.logSettings.wrapper) {
                console.log('End Wrapper %o', context.sequences[0].element);
            }

            workspace.textType.pop();
            workspace.usfmWrapperType = '';

            const wrapper = workspace.scopeManager.removeScope('wrapper');

            if (wrapper?.contentRoot) {
                const aElement = workspace.document.createElement('a');
                const matchWord =
                    workspace.scratch.wrapper.lemma || wrapper?.contentRoot?.innerText || '';
                aElement.setAttribute('match', matchWord.trim());
                aElement.setAttribute('href', ' ');
                aElement.classList.add('glossary');

                aElement.innerHTML = wrapper.contentRoot.innerHTML;

                wrapper.contentRoot.replaceChildren(aElement);
            }

            addToScratchPad(workspace.scratch, 'wrapper', { lemma: undefined });
        }
    }
]);
