import { FeatureSpec } from '../common';

export const documentFeature = new FeatureSpec([
    {
        event: 'startDocument',
        default: true,
        action({ workspace }) {
            const baseDiv = workspace.document.createElement('div');
            baseDiv.setAttribute('data-verse', 'start');
            baseDiv.setAttribute('data-phrase', 'none');
            // TODO: reset selections
            workspace.root.appendChild(baseDiv);
            workspace.scopeManager.push('document', workspace.root);
        }
    },
    {
        event: 'endDocument',
        default: true,
        action({ workspace, output }) {
            console.log([...workspace.scopeManager.stack]);
            workspace.scopeManager.pop('document');
            // TODO: event handlers, illustrations, annotations, plans
            output.root = workspace.root;
        }
    }
]);
