import { FeatureSpec, noaction, renderIfRegularOrIfHackedIntro } from '$lib/render-sofria/common';
import { getElement } from './common';

export const WARN_UNSUPPORTED_FEATURES = new FeatureSpec('Unsupported', [
    {
        event: 'startMilestone',
        stage: 'fallback',
        details: ({ context }) => ({ type: getElement(context).subType }),
        guard: ({ workspace }) => renderIfRegularOrIfHackedIntro(workspace),
        action: ({ context }) => {
            console.warn(`Unsupported Milestone Type: ${getElement(context).subType}`);
        }
    },
    {
        event: 'endMilestone',
        stage: 'fallback',
        details: ({ context }) => ({ type: getElement(context).subType }),
        guard: ({ workspace }) => renderIfRegularOrIfHackedIntro(workspace),
        action: noaction
    }
]);
