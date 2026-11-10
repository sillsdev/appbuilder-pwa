import { FeatureSpec, noaction } from '../common';
import { extractClassName, getBlock, getSequence, matchBlock, matchSequence } from './common';
import { renderBlock } from './common/grafts';
import { addPhrases, isTopWrapper, type SharedTextScratch } from './common/text';

// HACK: for proskomma, introduction will only be given as a graft on chapter 1, so we need to pass chapter 1 into proskomma
// open an issue?

export const introductions = new FeatureSpec<SharedTextScratch>('Introductions', {
    blockGraft: [
        {
            stage: 'standard',
            details: ({ context }) => ({ type: getBlock(context).subType }),
            guard: ({ context, workspace }) =>
                workspace.hackRenderIntro && matchBlock(context, 'introduction'),
            action: (environment) => renderBlock(environment, 'introduction')
        },
        {
            stage: 'standard',
            details: ({ context }) => ({ type: getBlock(context).subType }),
            guard: ({ context, workspace }) =>
                !workspace.hackRenderIntro && matchBlock(context, 'introduction'),
            action: ({ workspace }) => {
                if (workspace.logSettings.blockGraft) {
                    console.log('Skipping Introduction render');
                }
            }
        }
    ],
    startSequence: {
        stage: 'standard',
        details: ({ context }) => ({ type: getSequence(context).type }),
        guard: ({ context }) => matchSequence(context, 'introduction'),
        action: noaction
    },
    endSequence: {
        stage: 'standard',
        details: ({ context }) => ({ type: getSequence(context).type }),
        guard: ({ context }) => matchSequence(context, 'introduction'),
        action: noaction
    },
    startParagraph: {
        stage: 'standard',
        details: ({ context }) => ({ class: extractClassName(getBlock(context)) }),
        guard: ({ context }) => matchSequence(context, 'introduction'),
        action({ context, workspace }) {
            const introductionDiv = workspace.document.createElement('div');
            introductionDiv.classList.add(extractClassName(getBlock(context)));
            workspace.scopeManager.push('paragraph:introduction', introductionDiv);
            workspace.scopeManager.push(
                'wrapper:introduction',
                workspace.document.createElement('span')
            );
        }
    },
    endParagraph: {
        stage: 'standard',
        details: ({ context }) => ({ class: extractClassName(getBlock(context)) }),
        guard: ({ context }) => matchSequence(context, 'introduction'),
        action({ workspace }) {
            const wrapper = workspace.scopeManager.pop('wrapper:introduction');
            workspace.scopeManager.appendChildrenFromContainer(
                wrapper.root,
                'paragraph:introduction'
            );
            workspace.scopeManager.promoteContent('paragraph:introduction');
        }
    },
    text: {
        stage: 'standard',
        details: ({ workspace }) => workspace.scratch.text?.cleanedText,
        guard: ({ workspace, context }) =>
            !workspace.scratch.text?.empty &&
            matchSequence(context, 'introduction') &&
            isTopWrapper(workspace, 'wrapper:introduction'),
        action({ workspace }) {
            addPhrases(workspace, workspace.scratch.text!.cleanedText!);
        }
    }
});
