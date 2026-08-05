import { FeatureSpec, type RenderAction, type RenderEnvironment } from './common';

const documentFeature = new FeatureSpec([
    {
        eventTriggers: ['startDocument'],
        action({ workspace }: RenderEnvironment) {
            const baseDiv = workspace.document.createElement('div');
            baseDiv.setAttribute('data-verse', 'start');
            baseDiv.setAttribute('data-phrase', 'none');
            baseDiv.innerText = 'Beginning of document in DocumentFeature.ts! ||';
            this.output = baseDiv;
        }
    },
    {
        eventTriggers: ['endDocument'],
        action(environment: RenderEnvironment) {
            const endDiv = environment.workspace.document.createElement('div');
            endDiv.innerText = ' || End of document reached in DocumentFeature.ts';
            this.output = endDiv;
        }
    }
] as Array<RenderAction>);

export default documentFeature;
