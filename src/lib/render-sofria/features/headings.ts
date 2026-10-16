import { generateHTML } from '$lib/scripts/scripture-reference-utils';
import { addToScratchPad, FeatureSpec, noaction, renderIfRegularOrIfHackedIntro } from '../common';
import { extractClassName, getBlock, getSequence, matchBlock, matchSequence } from './common';
import { renderBlock } from './common/grafts';
import { addPhrases, type SharedTextScratch } from './common/text';

export const headings = new FeatureSpec<
    {
        paragraph?: { subheadingPrefixes?: string[] };
    } & SharedTextScratch
>('Headings', {
    blockGraft: {
        stage: 'standard',
        details: ({ context }) => ({ type: getBlock(context).subType }),
        guard: ({ context, workspace }) =>
            matchBlock(context, 'heading') && renderIfRegularOrIfHackedIntro(workspace),
        action: (environment) => renderBlock(environment, getBlock(environment.context).subType)
    },
    startSequence: {
        stage: 'standard',
        details: ({ context }) => ({ type: getSequence(context).type }),
        guard: ({ context, workspace }) =>
            matchSequence(context, 'heading') && renderIfRegularOrIfHackedIntro(workspace),
        action: noaction
    },
    endSequence: {
        stage: 'standard',
        details: ({ context }) => ({ type: getSequence(context).type }),
        guard: ({ context, workspace }) =>
            matchSequence(context, 'heading') && renderIfRegularOrIfHackedIntro(workspace),
        action: noaction
    },
    startParagraph: {
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
    endParagraph: {
        stage: 'standard',
        details: ({ context, workspace }) => ({
            class: extractClassName(getBlock(context)),
            render: workspace.currentTextPosition.render
        }),
        guard: ({ context, workspace }) =>
            matchSequence(context, 'heading') && renderIfRegularOrIfHackedIntro(workspace),
        action({ workspace }) {
            // only render heading if in target verse range
            if (workspace.currentTextPosition.render) {
                workspace.scopeManager.promoteContent('paragraph:heading');
            } else {
                workspace.scopeManager.pop('paragraph:heading');
            }
        }
    },
    text: {
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
                headerDiv.innerHTML += generateHTML(text, 'heading_ref-link');
            } else {
                addPhrases(workspace, text, { requireTop: true, newPhrase: false });
            }
        }
    },
    endDocument: {
        stage: 'standard',
        action({ workspace }) {
            workspace.root.querySelectorAll('a.heading_ref-link').forEach((el) => {
                el.addEventListener('click', (e) =>
                    workspace.events.clickHeaderRef(
                        e as MouseEvent,
                        el as HTMLAnchorElement,
                        workspace
                    )
                );
            });
        }
    }
});

function countSubheadingPrefixes(subHeadings: string[], labelPrefix: string) {
    return subHeadings.reduce(
        (count, subHeading) => (subHeading === labelPrefix ? count + 1 : count),
        0
    );
}
