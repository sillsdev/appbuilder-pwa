import { FeatureSpec, renderIfRegularOrIfHackedIntro, type RenderWorkspace } from '../common';
import { getElement } from './common';

export const annotations = new FeatureSpec('Annotations', {
    endDocument: {
        stage: 'standard',
        details: () => undefined,
        guard: ({ workspace }) => !workspace.hackRenderIntro,
        action({ workspace }) {
            workspace.events.updateAnnotations();
        }
    },
    endVerses: {
        stage: 'standard',
        details: ({ context }) => ({
            v: getElement(context).atts['number']
        }),
        guard: ({ workspace }) => renderIfRegularOrIfHackedIntro(workspace),
        action({ workspace }) {
            addSpanAfterVerse(workspace, 'bookmarks');
            addSpanAfterVerse(workspace, 'notes');
        }
    }
});

function addSpanAfterVerse(workspace: RenderWorkspace, idPrefix: string) {
    const span = workspace.document.createElement('span');
    span.id = idPrefix + workspace.currentTextPosition.verse;
    const verseDiv = workspace.scopeManager.find(
        `verses:${workspace.currentTextPosition.verse}`
    )?.root;
    if (verseDiv) {
        verseDiv.append(span);
    } else {
        const queryString = `div[data-verse="${workspace.currentTextPosition.verse}"]:not([data-phrase])`;
        let el: HTMLElement | null = null;
        for (let i = 0; i < workspace.scopeManager.depth(); i++) {
            if ((el = workspace.scopeManager.at(i).root.querySelector(queryString))) {
                break;
            }
        }
        el?.parentNode?.append(span);
    }
}
