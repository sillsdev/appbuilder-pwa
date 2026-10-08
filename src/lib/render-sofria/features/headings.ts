import { generateHTML } from '$lib/scripts/scripture-reference-utils';
import { addToScratchPad, FeatureSpec, noaction, renderIfRegularOrIfHackedIntro } from '../common';
import {
    extractClassName,
    getBlock,
    getElement,
    getSequence,
    matchBlock,
    matchSequence
} from './common';
import { renderBlock } from './common/grafts';
import { addPhrases, terminatePhrase, type SharedTextScratch } from './common/text';

// NOTE: Are there any other block grafts besides titles and introductions??

export const headings = new FeatureSpec<
    {
        paragraph?: { subheadingPrefixes?: string[] };
    } & SharedTextScratch
>(
    [
        {
            event: 'blockGraft',
            stage: 'standard',
            details: ({ context }) => ({ type: getBlock(context).subType }),
            guard: ({ context, workspace }) =>
                matchBlock(context, 'heading') && renderIfRegularOrIfHackedIntro(workspace),
            action: (environment) => renderBlock(environment, getBlock(environment.context).subType)
        },
        {
            event: 'startSequence',
            stage: 'standard',
            details: ({ context }) => ({ type: getSequence(context).type }),
            guard: ({ context, workspace }) =>
                matchSequence(context, 'heading') && renderIfRegularOrIfHackedIntro(workspace),
            action: noaction
        },
        {
            event: 'endSequence',
            stage: 'standard',
            details: ({ context }) => ({ type: getSequence(context).type }),
            guard: ({ context, workspace }) =>
                matchSequence(context, 'heading') && renderIfRegularOrIfHackedIntro(workspace),
            action: noaction
        },
        {
            event: 'startParagraph',
            stage: 'standard',
            details: ({ context }) => ({ class: extractClassName(getBlock(context)) }),
            guard: ({ context, workspace }) =>
                matchSequence(context, 'heading') && renderIfRegularOrIfHackedIntro(workspace),
            action({ context, workspace }) {
                const paraClass = extractClassName(getBlock(context));
                const headerDiv = document.createElement('div');
                headerDiv.classList.add(paraClass);

                const prefix = paraClass.replaceAll(/[0-9]/g, '');
                const subheaders = workspace.scratch.paragraph?.subheadingPrefixes ?? [];
                subheaders.push(prefix);
                addToScratchPad(workspace.scratch, 'paragraph', { subheadingPrefixes: subheaders });
                const count = countSubheadingPrefixes(subheaders, prefix);

                headerDiv.id = prefix + count;
                workspace.scopeManager.push('paragraph:heading', headerDiv);
            }
        },
        {
            event: 'endParagraph',
            stage: 'standard',
            details: ({ context }) => ({ class: extractClassName(getBlock(context)) }),
            guard: ({ context, workspace }) =>
                matchSequence(context, 'heading') && renderIfRegularOrIfHackedIntro(workspace),
            action({ workspace }) {
                workspace.scopeManager.promoteContent('paragraph:heading');
            }
        },
        {
            event: 'text',
            stage: 'standard',
            details: ({ workspace }) => workspace.scratch.text?.cleanedText,
            guard: ({ context, workspace }) =>
                !workspace.scratch.text?.empty &&
                matchSequence(context, 'heading') &&
                renderIfRegularOrIfHackedIntro(workspace),
            action({ context, workspace }) {
                const text: string = workspace.scratch.text!.cleanedText!;
                if (matchBlock(context, 'usfm:r')) {
                    // This is for usfm:r like you will find in CUK Headers
                    // which contain references inline
                    const headerDiv = workspace.scopeManager.find('paragraph:heading')!.root;
                    headerDiv.innerHTML += generateHTML(text, 'header-ref');
                }
                // heading without cross-ref, jmp, audioc, reflink, and everything else
                else {
                    addPhrases(workspace, text);
                }
            }
        }
    ],
    'Headings'
);

function countSubheadingPrefixes(subHeadings: string[], labelPrefix: string) {
    return subHeadings.reduce(
        (count, subHeading) => (subHeading === labelPrefix ? count + 1 : count),
        0
    );
}
