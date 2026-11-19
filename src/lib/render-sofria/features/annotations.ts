import {
    addToScratchPad,
    FeatureSpec,
    renderIfRegularOrIfHackedIntro,
    type RenderWorkspace
} from '../common';
import { getElement } from './common';

export const annotations = new FeatureSpec<{ verses?: { numbers?: string[] } }>('Annotations', {
    startVerses: {
        stage: 'init',
        details: ({ context }) => ({ verse: getElement(context).atts['number'] }),
        guard: ({ workspace }) => renderIfRegularOrIfHackedIntro(workspace),
        action: ({ context, workspace }) => {
            const numbers = workspace.scratch.verses?.numbers ?? [];
            numbers.push(getElement(context).atts['number']);
            addToScratchPad(workspace.scratch, 'verses', { numbers });
        }
    },
    endDocument: {
        stage: 'standard',
        details: ({ workspace }) => ({
            verses: workspace.scratch.verses?.numbers
        }),
        guard: ({ workspace }) => !workspace.hackRenderIntro,
        action({ workspace }) {
            workspace.scratch.verses?.numbers?.forEach((num) => {
                const lastPhrase = Array.from(
                    workspace.root.querySelectorAll(`[data-verse="${num}"][data-phrase]`)
                ).at(-1) as HTMLDivElement | null;
                // add in reverse order so .after adds in correct order...
                addSpanAfterVerse(workspace, 'notes', lastPhrase);
                addSpanAfterVerse(workspace, 'bookmarks', lastPhrase);
            });
            workspace.events.updateAnnotations();
            addToScratchPad(workspace.scratch, 'verses', { numbers: undefined });
        }
    }
});

function addSpanAfterVerse(
    workspace: RenderWorkspace,
    idPrefix: string,
    lastPhrase: HTMLDivElement | null
) {
    const span = workspace.document.createElement('span');
    span.id = idPrefix + lastPhrase?.getAttribute('data-verse');
    lastPhrase?.after(span);
}
