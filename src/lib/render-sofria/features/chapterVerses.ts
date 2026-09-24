import { FeatureSpec, renderIfRegularOrIfHackedIntro, type RenderEnvironment } from '../common';

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

            if (workspace.verseLayout === 'one-per-lin') {
                const verseDiv = workspace.document.createElement('div');
                verseDiv.classList.add('verse-block');
                workspace.scopeManager.push('verses', verseDiv);
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

            if (workspace.verseLayout === 'one-per-lin') {
                const verseDiv = workspace.scopeManager.find('verses')?.root;
                if (verseDiv) {
                    workspace.scopeManager.appendContent(verseDiv, 'paragraph');
                }
            }

            // TODO add bookmarks, notes, plans
        }
    }
]);
