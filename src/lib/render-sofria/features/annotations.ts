import { FeatureSpec, renderIfRegularOrIfHackedIntro, type RenderWorkspace } from '../common';
import { getElement } from './common';

export const annotations = new FeatureSpec('Annotations', {
    endDocument: {
        stage: 'standard',
        details: ({ workspace }) => ({
            verses: workspace.root.querySelectorAll('[data-verse]:not([data-phrase])').length
        }),
        guard: ({ workspace }) => !workspace.hackRenderIntro,
        action({ workspace }) {
            const verseDivs = Array.from(
                workspace.root.querySelectorAll('[data-verse]:not([data-phrase])')
            ) as HTMLDivElement[];
            verseDivs.forEach((div) => {
                addSpanAfterVerse(workspace, 'bookmarks', div);
                addSpanAfterVerse(workspace, 'notes', div);
            });
            workspace.events.updateAnnotations();
        }
    }
});

function addSpanAfterVerse(workspace: RenderWorkspace, idPrefix: string, verseDiv: HTMLDivElement) {
    const span = workspace.document.createElement('span');
    span.id = idPrefix + verseDiv.getAttribute('data-verse');
    const lastChild = verseDiv.lastElementChild;
    if (lastChild?.getAttribute('data-phrase') || lastChild?.tagName === 'SPAN') {
        lastChild.after(span);
    } else {
        lastChild?.appendChild(span);
    }
}
