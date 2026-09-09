import { FeatureSpec, type RenderAction, type RenderEnvironment } from '../common';

export const documentFeature = new FeatureSpec([
    {
        eventTriggers: ['startDocument'],
        action({ workspace }: RenderEnvironment) {
            const baseDiv = workspace.document.createElement('div');
            baseDiv.setAttribute('data-verse', 'start');
            baseDiv.setAttribute('data-phrase', 'none');
            // TODO: reset selections
            workspace.root.appendChild(baseDiv);
            workspace.scopeManager.addScope('document', workspace.root);
        }
    },
    {
        eventTriggers: ['endDocument'],
        action({ workspace, output }: RenderEnvironment) {
            workspace.scopeManager.removeScope('document');
            // TODO: event handlers, illustrations, annotations, plans
            output.root = workspace.root;
        }
    }
] as Array<RenderAction>);
