import type { RenderElement } from 'proskomma-json-tools';
import {
    addToScratchPad,
    FeatureSpec,
    renderIfRegularOrIfHackedIntro,
    type RenderWorkspace
} from '../../common';
import { renderGraftedSequence, type BlockGraftScratch } from './common';

type InlineGraftScratch = { inlineGraft?: { footnoteIdIndex?: number } };

export const inlineGrafts = new FeatureSpec<BlockGraftScratch & InlineGraftScratch>([
    {
        event: 'inlineGraft',
        default: true,
        guard: ({ workspace }) => renderIfRegularOrIfHackedIntro(workspace),
        action: (environment) => {
            const { context, workspace } = environment;
            const element = context.sequences[0].element;
            if (workspace.logSettings.inlineGraft) {
                console.log(
                    'Inline Graft Type: %o, Subtype: %o, id: %o %o',
                    element.type,
                    element.subType,
                    element.sequence.id,
                    context.sequences[0].element
                );
            }
            const graftRecord: RenderElement = {
                type: element.type,
                subType: element.subType,
                sequence: {},
                atts: {},
                text: ''
            };
            if (element.subType === 'xref' || element.subType === 'footnote') {
                workspace.textType.push('footnote');
                const [callerRoot, contentRoot] = createFootnoteDiv(workspace, element);
                workspace.scopeManager.addScope('inlineGraft:note_caller', callerRoot);
                workspace.scopeManager.addScope('inlineGraft:footnote', contentRoot);
            } else if (element.subType === 'note_caller') {
                workspace.textType.push(element.subType);
            }

            renderGraftedSequence(environment, graftRecord.sequence);

            if (element.subType === 'xref' || element.subType === 'footnote') {
                const callerRoot =
                    workspace.scopeManager.getScope('inlineGraft:note_caller')?.contentRoot;
                const contentRoot =
                    workspace.scopeManager.removeScope('inlineGraft:footnote')?.contentRoot;
                if (
                    callerRoot &&
                    contentRoot &&
                    callerRoot.getAttribute('data-graft') === contentRoot.id
                ) {
                    workspace.scopeManager.removeScope('inlineGraft:note_caller');
                    callerRoot.appendChild(contentRoot);
                    workspace.scopeManager.appendInnerContent(callerRoot);
                    // Add space after footnote if there are multiple footnotes.
                    // TODO: How do we tell there are multiple???
                    workspace.scopeManager.appendInnerContent(
                        workspace.document.createTextNode('\u00A0')
                    );
                }
                workspace.textType.pop();
            } else if (element.subType === 'note_caller') {
                workspace.textType.pop();
            }
            if (workspace.logSettings.inlineGraft) {
                console.log('Inline Graft End');
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

    // TODO: add click handler?

    const callerRoot = workspace.document.createElement('span');
    callerRoot.setAttribute('data-graft', footnoteId);
    const a = workspace.document.createElement('a');
    const sup = workspace.document.createElement('sup');
    sup.classList.add('footnote');
    a.appendChild(sup);
    a.classList.add('cursor-pointer');
    callerRoot.appendChild(a);
    if (workspace.logSettings.inlineGraft) {
        console.log('Create Footnote %o %o', callerRoot, contentRoot);
    }
    return [callerRoot, contentRoot];
}
