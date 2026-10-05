import { FeatureSpec, renderIfRegularOrIfHackedIntro, type RenderWorkspace } from '../common';
import { addPlanDiv } from './plans';
import { terminatePhrase } from './text';

export const chapterVerses = new FeatureSpec([
    {
        event: 'startChapter',
        guard: ({ workspace }) => renderIfRegularOrIfHackedIntro(workspace),
        action({ context, workspace }) {
            if (workspace.logSettings.chapter) {
                const element = context.sequences[0].element;
                console.log('Start Chapter %o %o', element.atts['number'], element);
            }
            workspace.currentTextPosition.chapter = context.sequences[0].element.atts['number'];
        }
    },
    {
        event: 'endChapter',
        guard: ({ workspace }) => renderIfRegularOrIfHackedIntro(workspace),
        action({ context, workspace }) {
            if (workspace.logSettings.chapter) {
                const element = context.sequences[0].element;
                console.log('End Chapter %o %o', element.atts['number'], element);
            }
            workspace.currentTextPosition.chapter = 'none';
        }
    },
    {
        event: 'startVerses',
        guard: ({ workspace }) => renderIfRegularOrIfHackedIntro(workspace),
        action({ context, workspace }) {
            const element = context.sequences[0].element;
            workspace.currentTextPosition.verse = element.atts['number'];
            workspace.currentTextPosition.phraseIndex = 0;

            if (workspace.logSettings.verses) {
                console.log('verses %o start phrase', element.atts.number);
            }

            const initDiv =
                workspace.scopeManager.remove('verses:init')?.root ??
                workspace.document.createElement('div');
            const existingDiv = workspace.scopeManager.find(
                `verses:${workspace.currentTextPosition.verse}`
            )?.root;

            if (!existingDiv) {
                initDiv.setAttribute('data-verse', element.atts['number']);
                if (workspace.viewSettings.verseLayout === 'one-per-line') {
                    initDiv.classList.add('verse-block');
                } else {
                    initDiv.classList.add('txs');
                }
                workspace.scopeManager.push(`verses:${element.atts['number']}`, initDiv);
            } else {
                workspace.scopeManager.push('verses:init', initDiv);
            }
            if (workspace.logSettings.verses) {
                console.log('IN: %o', workspace.scopeManager.find('paragraph')?.root);
            }
        }
    },
    {
        event: 'endVerses',
        guard: ({ workspace }) => renderIfRegularOrIfHackedIntro(workspace),
        action({ context, workspace }) {
            const element = context.sequences[0].element;
            if (workspace.logSettings.verses) {
                console.log('End Verses %o %o', element.atts['number'], element);
            }
            workspace.currentTextPosition.verse = 'none';

            terminatePhrase(workspace);

            addSpanAfterVerse(workspace, 'bookmarks');
            addSpanAfterVerse(workspace, 'notes');
            addPlanDiv(workspace, element.atts['number']);
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
