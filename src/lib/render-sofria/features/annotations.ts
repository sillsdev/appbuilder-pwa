import {
    addToScratchPad,
    FeatureSpec,
    renderIfRegularOrIfHackedIntro,
    type RenderWorkspace
} from '../common';
import { getElement } from './common';
import { verseInRange } from './common/text';

export const annotations = new FeatureSpec<{ verses?: { numbers?: string[] } }>('Annotations', {
    startVerses: {
        stage: 'init',
        details: ({ context }) => ({ verse: getElement(context).atts['number'] }),
        guard: ({ workspace }) => renderIfRegularOrIfHackedIntro(workspace),
        action: ({ context, workspace }) => {
            const num = getElement(context).atts['number'];
            if (verseInRange(workspace, num)) {
                const numbers = workspace.scratch.verses?.numbers ?? [];
                numbers.push(getElement(context).atts['number']);
                addToScratchPad(workspace.scratch, 'verses', { numbers });
            }
        }
    },
    endDocument: [
        {
            stage: 'init',
            details: ({ workspace }) => ({
                verses: workspace.scratch.verses?.numbers
            }),
            guard: ({ workspace }) => renderIfRegularOrIfHackedIntro(workspace),
            action({ workspace }) {
                workspace.scratch.verses?.numbers?.forEach((num) => {
                    let lastPhrase = Array.from(
                        workspace.root.querySelectorAll(`[data-verse="${num}"]`)
                    ).at(-1) as Element | null | undefined;
                    if (!lastPhrase?.getAttribute('data-phrase')) {
                        lastPhrase = lastPhrase?.lastElementChild;
                    }
                    if (lastPhrase) {
                        // add in reverse order so .after adds in correct order...
                        addSpanAfterVerse(workspace, `bookmarks${num}`, lastPhrase);
                        addSpanAfterVerse(workspace, `notes${num}`, lastPhrase);
                    } else {
                        console.warn(`Failed to place annotation spans for verse ${num}`);
                    }
                });
                addToScratchPad(workspace.scratch, 'verses', { numbers: undefined });
            }
        },
        {
            stage: 'standard',
            details: () => undefined,
            guard: ({ workspace }) => renderIfRegularOrIfHackedIntro(workspace),
            action({ workspace }) {
                workspace.events.updateAnnotations();
            }
        }
    ]
});

function addSpanAfterVerse(workspace: RenderWorkspace, id: string, lastPhrase: Element) {
    const span = workspace.document.createElement('span');
    span.id = id;
    lastPhrase.after(span);
}
