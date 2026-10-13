import { FeatureSpec, renderIfRegularOrIfHackedIntro, type RenderWorkspace } from '../common';
import { getElement } from './common';
import { addPlanDiv } from './common/plans';

export const plans = new FeatureSpec('Plans', [
    {
        event: 'endDocument',
        stage: 'standard',
        details: () => undefined,
        guard: ({ workspace }) => !workspace.hackRenderIntro,
        action({ workspace }) {
            addPlanDiv(workspace, '-1');
        }
    },
    {
        event: 'endVerses',
        stage: 'standard',
        details: ({ context }) => ({
            v: getElement(context).atts['number']
        }),
        guard: ({ workspace }) => renderIfRegularOrIfHackedIntro(workspace),
        action({ context, workspace }) {
            addPlanDiv(workspace, getElement(context).atts['number']);
        }
    }
]);
