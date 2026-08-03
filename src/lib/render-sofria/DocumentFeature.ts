import { FeatureSpec, type RenderAction, type RenderEnvironment } from './common';

const documentFeature = new FeatureSpec([
    {
        eventTriggers: ['startDocument'],
        action({ workspace }: RenderEnvironment) {
            const baseDiv = workspace.document.createElement('div');
            baseDiv.setAttribute('data-verse', 'start');
            baseDiv.setAttribute('data-phrase', 'none');
            this.output = baseDiv;
            (this.output as HTMLDivElement).innerText =
                'Beginning of document in DocumentFeature.ts! ||';
        }
    },
    {
        eventTriggers: ['text'],
        action({ context, workspace }: RenderEnvironment) {
            const text = context.sequences[0].element.text;
            const textDiv = workspace.document.createElement('div');
            textDiv.innerText = text;
            this.output = textDiv;
        }
    },
    {
        eventTriggers: ['endDocument'],
        action(environment: RenderEnvironment) {
            this.output = environment.workspace.document.createElement('div');
            (this.output as HTMLDivElement).innerText =
                ' || End of document reached in DocumentFeature.ts';
        }
    }
] as Array<RenderAction>);

export default documentFeature;
