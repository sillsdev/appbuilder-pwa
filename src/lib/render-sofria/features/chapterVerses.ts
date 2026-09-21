import { FeatureSpec, renderIfRegularOrIfHackedIntro, type RenderEnvironment } from '../common';

export const chapterVerses = new FeatureSpec([
    {
        eventTriggers: ['startChapter'],
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
        eventTriggers: ['endChapter'],
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
        eventTriggers: ['startVerses'],
        guard: ({ workspace }) => renderIfRegularOrIfHackedIntro(workspace),
        action({ context, workspace }) {
            const element = context.sequences[0].element;
            workspace.currentTextPosition.verse = element.atts['number'];
            workspace.currentTextPosition.phraseIndex = 0;

            if (workspace.logSettings.verses) {
                console.log('verses %o start phrase', element.atts.number);
            }

            if (workspace.verseLayout === 'one-per-lin') {
                const verseDiv = workspace.document.createElement('div');
                verseDiv.classList.add('verse-block');
                workspace.scopeManager.addScope('verses', verseDiv);
            }
            if (workspace.logSettings.verses) {
                console.log('IN: %o', workspace.scopeManager.getActiveContentRoot('paragraph'));
            }
        }
    },
    {
        eventTriggers: ['endVerses'],
        guard: ({ workspace }) => renderIfRegularOrIfHackedIntro(workspace),
        action({ context, workspace }) {
            const element = context.sequences[0].element;
            if (workspace.logSettings.verses) {
                console.log('End Verses %o %o', element.atts['number'], element);
            }
            workspace.currentTextPosition.verse = 'none';

            if (workspace.verseLayout === 'one-per-lin') {
                const verseDiv = workspace.scopeManager.getActiveContentRoot('verses');
                if (verseDiv) {
                    workspace.scopeManager.appendInnerContent(verseDiv, 'paragraph');
                }
            }

            // TODO add bookmarks, notes, plans
        }
    }
]);
