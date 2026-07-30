import { FeatureSpec, type RenderAction, type RenderEnvironment } from './common';

const documentFeature = new FeatureSpec([
    {
        eventTriggers: ['startDocument'],
        action(environment: RenderEnvironment) {
            this.output = 0;
        }
    }
] as Array<RenderAction>);
