import { FeatureSpec, type RenderEnvironment } from './common';

const textPositionFeature = new FeatureSpec([
    {
        eventTriggers: ['startChapter'],
        action({ context, workspace }: RenderEnvironment) {
            workspace.currentTextPosition.chapter = context.sequences[0].element.atts['number'];
        }
    },
    {
        eventTriggers: ['endChapter'],
        action({ context, workspace }: RenderEnvironment) {
            workspace.currentTextPosition.chapter = 'none';
        }
    },
    {
        eventTriggers: ['startVerses'],
        action({ context, workspace }: RenderEnvironment) {
            workspace.currentTextPosition.verse = context.sequences[0].element.atts['number'];
        }
    },
    {
        eventTriggers: ['endVerses'],
        action({ context, workspace }: RenderEnvironment) {
            workspace.currentTextPosition.verse = 'none';
        }
    }
]);

export default textPositionFeature;
