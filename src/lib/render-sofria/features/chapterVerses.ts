import { FeatureSpec, renderIfRegularOrIfHackedIntro, type RenderWorkspace } from '../common';
import { addPlanDiv } from './plans';
import { terminatePhrase } from './text';

export const chapterVerses = new FeatureSpec([
    {
        event: 'startChapter',
        guard: ({ workspace }) => renderIfRegularOrIfHackedIntro(workspace),
        action({ context, workspace }) {
            workspace.currentTextPosition.chapter = context.sequences[0].element.atts['number'];
        }
    },
    {
        event: 'endChapter',
        guard: ({ workspace }) => renderIfRegularOrIfHackedIntro(workspace),
        action({ workspace }) {
            workspace.currentTextPosition.chapter = 'none';
        }
    },
    {
        event: 'startVerses',
        guard: ({ workspace }) => renderIfRegularOrIfHackedIntro(workspace),
        action({ context, workspace }) {
            const verse = context.sequences[0].element.atts['number'];
            workspace.currentTextPosition.verse = verse;
            workspace.currentTextPosition.phraseIndex = 0;

            const verseDiv = workspace.document.createElement('div');
            verseDiv.setAttribute('data-verse', verse);

            if (workspace.viewSettings.verseLayout === 'one-per-line') {
                verseDiv.classList.add('verse-block');
            } else {
                verseDiv.classList.add('txs');
            }

            workspace.scopeManager.push(`verses:${verse}`, verseDiv);
        }
    },
    {
        event: 'endVerses',
        guard: ({ workspace }) => renderIfRegularOrIfHackedIntro(workspace),
        action({ context, workspace }) {
            workspace.currentTextPosition.verse = 'none';

            terminatePhrase(workspace);

            addSpanAfterVerse(workspace, 'bookmarks');
            addSpanAfterVerse(workspace, 'notes');
            addPlanDiv(workspace, context.sequences[0].element.atts['number']);
        }
    }
]);

function addSpanAfterVerse(workspace: RenderWorkspace, idPrefix: string) {
    const span = workspace.document.createElement('span');
    span.id = idPrefix + workspace.currentTextPosition.verse;
    const queryString = `div[data-verse="${workspace.currentTextPosition.verse}"][data-phrase="${workspace.currentTextPosition.phraseIndex}"]`;
    const el =
        workspace.scopeManager.find('paragraph')?.root.querySelector(queryString) ??
        workspace.root.querySelector(queryString);
    el?.parentNode?.insertBefore(span, el.nextSibling);
}
