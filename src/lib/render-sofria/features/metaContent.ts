import { FeatureSpec, type RenderEnvironment } from '../common';

export const metaContent = new FeatureSpec([
    {
        eventTriggers: ['metaContent'],
        action({ context, workspace }) {
            if (workspace.logSettings.meta) {
                console.log('Meta Content %o', context.sequences[0].element);
            }
        }
    }
]);
