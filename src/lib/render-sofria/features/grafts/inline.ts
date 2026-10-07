import type { RenderElement } from 'proskomma-json-tools';
import {
    addToScratchPad,
    FeatureSpec,
    renderIfRegularOrIfHackedIntro,
    type RenderWorkspace
} from '../../common';
import { getElement } from '../common';
import { renderGraftedSequence, type BlockGraftScratch } from './common';

type InlineGraftScratch = { inlineGraft?: { footnoteIdIndex?: number } };

export const inlineGrafts = new FeatureSpec<BlockGraftScratch & InlineGraftScratch>([
    {
        event: 'inlineGraft',
        stage: 'fallback',
        guard: ({ workspace }) => renderIfRegularOrIfHackedIntro(workspace),
        action: (environment) => {
            const { context, workspace } = environment;
            const element = getElement(context);
            const graftRecord: RenderElement = {
                type: element.type,
                subType: element.subType,
                sequence: {},
                atts: {},
                text: ''
            };
            if (element.subType === 'xref' || element.subType === 'footnote') {
                const [callerRoot, contentRoot] = createFootnoteDiv(workspace, element);
                workspace.scopeManager.push('inlineGraft:note_caller', callerRoot);
                workspace.scopeManager.push('inlineGraft:footnote', contentRoot);
            }

            renderGraftedSequence(environment, graftRecord.sequence);

            if (element.subType === 'xref' || element.subType === 'footnote') {
                const callerRoot = workspace.scopeManager.find('inlineGraft:note_caller')?.root;
                const contentRoot = workspace.scopeManager.pop('inlineGraft:footnote').root;
                if (callerRoot?.getAttribute('data-graft') === contentRoot.id) {
                    workspace.scopeManager.pop('inlineGraft:note_caller');
                    callerRoot.appendChild(contentRoot);
                    workspace.scopeManager.appendContent(callerRoot);
                }
            }
        }
    }
]);

function createFootnoteDiv(workspace: RenderWorkspace<InlineGraftScratch>, element: RenderElement) {
    const footnoteIdIndex = (workspace.scratch.inlineGraft?.footnoteIdIndex ?? 0) + 1;
    const footnoteId = `X-${footnoteIdIndex}`;
    addToScratchPad(workspace.scratch, 'inlineGraft', { footnoteIdIndex });
    const contentRoot = workspace.document.createElement('div');
    contentRoot.id = footnoteId;
    contentRoot.style.display = 'none';
    contentRoot.setAttribute('type', element.subType);

    const callerRoot = workspace.document.createElement('span');
    callerRoot.setAttribute('data-graft', footnoteId);
    const a = workspace.document.createElement('a');
    const sup = workspace.document.createElement('sup');
    sup.classList.add('footnote');
    a.appendChild(sup);
    a.classList.add('cursor-pointer');
    callerRoot.appendChild(a);
    callerRoot.addEventListener('click', (e) => workspace.events.openFootnoote(e, footnoteId));
    return [callerRoot, contentRoot];
}
