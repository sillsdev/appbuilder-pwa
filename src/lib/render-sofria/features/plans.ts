import {
    addToScratchPad,
    FeatureSpec,
    renderIfRegularOrIfHackedIntro,
    type RenderWorkspace
} from '../common';
import { getElement } from './common';
import { addPlanDiv, planClicked } from './common/plans';

export const plans = new FeatureSpec<{ document?: { planClicks?: string[] } }>('Plans', {
    endDocument: {
        stage: 'standard',
        details: () => undefined,
        guard: ({ workspace }) => !workspace.hackRenderIntro,
        action({ workspace }) {
            const planClicks = workspace.scratch.document?.planClicks ?? [];
            planClicks.push(...addPlanDiv(workspace, '-1'));
            addToScratchPad(workspace.scratch, 'document', { planClicks: undefined });

            planClicks.forEach((id) => {
                workspace.root
                    .querySelector(`[id="${id}"]`)
                    ?.addEventListener('click', () => planClicked(workspace));
            });
        }
    },
    endVerses: {
        stage: 'standard',
        details: ({ context }) => ({
            v: getElement(context).atts['number']
        }),
        guard: ({ workspace }) => renderIfRegularOrIfHackedIntro(workspace),
        action({ context, workspace }) {
            const planClicks = workspace.scratch.document?.planClicks ?? [];
            planClicks.push(...addPlanDiv(workspace, getElement(context).atts['number']));
            addToScratchPad(workspace.scratch, 'document', { planClicks });
        }
    }
});
