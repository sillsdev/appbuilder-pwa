import { FeatureSpec, renderIfRegularOrIfHackedIntro } from '../common';
import { extractClassName, getBlock, getSequence, matchBlock, matchSequence } from './common';
import { renderBlock } from './common/grafts';
import { addPhrases, type SharedTextScratch } from './common/text';

export const titles = new FeatureSpec<SharedTextScratch>(
    [
        {
            event: 'blockGraft',
            stage: 'standard',
            details: ({ context }) => ({ type: getBlock(context).subType }),
            guard: ({ context }) => matchBlock(context, 'title'),
            action: (environment) => renderBlock(environment, 'title')
        },
        {
            event: 'startSequence',
            stage: 'standard',
            details: ({ context }) => ({ type: getSequence(context).type }),
            guard: ({ context, workspace }) =>
                matchSequence(context, 'title') && renderIfRegularOrIfHackedIntro(workspace),
            action({ workspace }) {
                const div = document.createElement('div');
                div.setAttribute('data-verse', 'title');
                div.setAttribute('data-phrase', 'none');
                div.classList.add('scroll-item');
                workspace.scopeManager.push('sequence:title', div);
            }
        },
        {
            event: 'endSequence',
            stage: 'standard',
            details: ({ context }) => ({ type: getSequence(context).type }),
            guard: ({ context, workspace }) =>
                matchSequence(context, 'title') && renderIfRegularOrIfHackedIntro(workspace),
            action: ({ workspace }) => {
                const spacer = workspace.document.createElement('div');
                spacer.classList.add('b');
                workspace.scopeManager.appendContent(spacer, 'sequence:title');
                workspace.scopeManager.appendContent(
                    spacer.cloneNode(true) as Element,
                    'sequence:title'
                );
                workspace.scopeManager.promoteContent('sequence:title');
            }
        },
        {
            event: 'startParagraph',
            stage: 'standard',
            details: ({ context }) => ({ class: extractClassName(getBlock(context)) }),
            guard: ({ context, workspace }) =>
                matchSequence(context, 'title') && renderIfRegularOrIfHackedIntro(workspace),
            action({ context, workspace }) {
                const titleDiv = workspace.document.createElement('div');
                titleDiv.classList.add(extractClassName(getBlock(context)));
                workspace.scopeManager.push('paragraph:title', titleDiv);
            }
        },
        {
            event: 'endParagraph',
            stage: 'standard',
            details: ({ context }) => ({ class: extractClassName(getBlock(context)) }),
            guard: ({ context, workspace }) =>
                matchSequence(context, 'title') && renderIfRegularOrIfHackedIntro(workspace),
            action({ workspace }) {
                workspace.scopeManager.promoteContent('paragraph:title');
            }
        },
        {
            event: 'text',
            stage: 'standard',
            details: ({ workspace }) => workspace.scratch.text?.cleanedText,
            guard: ({ context, workspace }) =>
                !workspace.scratch.text?.empty &&
                matchSequence(context, 'title') &&
                renderIfRegularOrIfHackedIntro(workspace),
            action({ workspace }) {
                addPhrases(workspace, workspace.scratch.text!.cleanedText!);
            }
        }
    ],
    'Titles'
);
