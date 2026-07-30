import { FeatureSpec, type RenderAction, type RenderEnvironment } from './common';

const documentFeature = new FeatureSpec([
    {
        eventTriggers: ['startDocument'],
        action(environment: RenderEnvironment) {
            this.output = environment.workspace.document.createElement('div');
            (this.output as HTMLDivElement).innerText =
                'Hello from somewhere in DocumentFeature.ts!';
        }
    },
    {
        eventTriggers: ['endDocument'],
        action(environment: RenderEnvironment) {
            this.output = environment.workspace.document.createElement('div');
            (this.output as HTMLDivElement).innerText =
                'End of document reached in DocumentFeature.ts';
        }
    }
] as Array<RenderAction>);
