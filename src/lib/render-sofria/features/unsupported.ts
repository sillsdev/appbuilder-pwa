import { FeatureSpec, noaction, renderIfRegularOrIfHackedIntro } from '$lib/render-sofria/common';
import { getBlock, getElement } from './common';

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
    },
    {
        event: 'metaContent',
        stage: 'fallback',
        details: () => undefined,
        guard: ({ workspace }) => renderIfRegularOrIfHackedIntro(workspace),
        action: ({ context }) => {
            console.warn(`Unsupported Meta Content: %o`, context);
        }
    },
    {
        event: 'blockGraft',
        stage: 'fallback',
        details: ({ context }) => ({ type: getBlock(context).subType }),
        guard: ({ workspace }) => renderIfRegularOrIfHackedIntro(workspace),
        action: ({ context }) => {
            console.warn(`Unsupported Block Type: ${getBlock(context).subType}`);
        }
    },
    {
        event: 'inlineGraft',
        stage: 'fallback',
        details: ({ context }) => ({ type: getElement(context).subType }),
        guard: ({ workspace }) => renderIfRegularOrIfHackedIntro(workspace),
        action: ({ context }) => {
            console.warn(`Unsupported Element Type: ${getElement(context).subType}`);
        }
    }
]);
