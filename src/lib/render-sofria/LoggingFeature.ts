import { FeatureSpec, type RenderEnvironment } from './common';

const loggingFeature = new FeatureSpec([
    {
        eventTriggers: ['startSequence'],
        action({ context, workspace }: RenderEnvironment) {
            if (workspace.logSettings.sequence) {
                console.log('Start sequence |%o|', context.sequences[0].type);
            }
        }
    },
    {
        eventTriggers: ['endSequence'],
        action({ context, workspace }: RenderEnvironment) {
            if (workspace.logSettings.sequence) {
                console.log('End sequence |%o|', context.sequences[0].type);
            }
        }
    }
]);

export default loggingFeature;
