import { FeatureSpec, renderIfRegularOrIfHackedIntro, type RenderWorkspace } from '../common';
import { getElement } from './common';
import { addPlanDiv } from './common/plans';
import { terminatePhrase } from './common/text';

export const chapterVerses = new FeatureSpec([
    {
        event: 'startChapter',
        stage: 'fallback',
        details: ({ context }) => ({ c: getElement(context).atts['number'] }),
        guard: ({ workspace }) => renderIfRegularOrIfHackedIntro(workspace),
        action({ context, workspace }) {
            workspace.currentTextPosition.chapter = getElement(context).atts['number'];
        }
    },
    {
        event: 'endChapter',
        stage: 'fallback',
        details: ({ context }) => ({ c: getElement(context).atts['number'] }),
        guard: ({ workspace }) => renderIfRegularOrIfHackedIntro(workspace),
        action({ workspace }) {
            workspace.currentTextPosition.chapter = 'none';
        }
    },
    {
        event: 'startVerses',
        stage: 'fallback',
        details: ({ context }) => ({ v: getElement(context).atts['number'] }),
        guard: ({ workspace }) => renderIfRegularOrIfHackedIntro(workspace),
        action({ context, workspace }) {
            const verse = getElement(context).atts['number'];
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
        stage: 'fallback',
        details: ({ context, workspace }) => ({
            v: getElement(context).atts['number'],
            phrase: workspace.scopeManager.find('phrase')?.root.innerText
        }),
        guard: ({ workspace }) => renderIfRegularOrIfHackedIntro(workspace),
        action({ context, workspace }) {
            terminatePhrase(workspace);

            addSpanAfterVerse(workspace, 'bookmarks');
            addSpanAfterVerse(workspace, 'notes');
            addPlanDiv(workspace, getElement(context).atts['number']);

            workspace.currentTextPosition.verse = 'none';
        }
    }
]);

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
        const el = (workspace.scopeManager.find('paragraph') ?? workspace)?.root.querySelector(
            queryString
        );
        console.log(el);
        el?.parentNode?.append(span);
    }
}
