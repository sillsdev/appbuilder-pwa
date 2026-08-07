import {
    FeatureSpec,
    RenderScope,
    RenderScopeLevel,
    type RenderAction,
    type RenderEnvironment
} from './common';

const documentFeature = new FeatureSpec([
    {
        eventTriggers: ['startDocument'],
        action({ workspace }: RenderEnvironment) {
            const baseDiv = workspace.document.createElement('div');
            baseDiv.setAttribute('data-verse', 'start');
            baseDiv.setAttribute('data-phrase', 'none');
            baseDiv.innerText = 'Beginning of document in DocumentFeature.ts! ||';

            workspace.root.appendChild(baseDiv);
            workspace.scopeManager.addScope(RenderScopeLevel.document, workspace.root);
        }
    },
    {
        eventTriggers: ['endDocument'],
        action({ workspace, output }: RenderEnvironment) {
            const endDiv = workspace.document.createElement('div');
            endDiv.innerText = ' || End of document reached in DocumentFeature.ts';
            workspace.scopeManager.appendInnerContent(endDiv);
            workspace.scopeManager.removeScope(RenderScopeLevel.document);
            output.root = workspace.root;
        }
    }
] as Array<RenderAction>);

export default documentFeature;
