import { FeatureSpec, renderIfRegularOrIfHackedIntro } from '../common';
import { getElement } from './common';
import { terminatePhrase } from './common/text';

export const verses = new FeatureSpec('Default', [
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
        stage: 'init',
        details: ({ context, workspace }) => ({
            v: getElement(context).atts['number'],
            phrase: workspace.scopeManager.find('phrase')?.root.innerText
        }),
        guard: ({ workspace }) => renderIfRegularOrIfHackedIntro(workspace),
        action({ workspace }) {
            terminatePhrase(workspace);
        }
    },
    {
        event: 'endVerses',
        stage: 'cleanup',
        details: ({ context }) => ({
            v: getElement(context).atts['number']
        }),
        guard: ({ workspace }) => renderIfRegularOrIfHackedIntro(workspace),
        action({ workspace }) {
            workspace.currentTextPosition.verse = 'none';
        }
    }
]);
