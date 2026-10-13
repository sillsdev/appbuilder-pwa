import { FeatureSpec, noaction, renderIfRegularOrIfHackedIntro } from '../common';
import { getBlock, getElement } from './common';

/**
 * Events that are just here for logging purposes.
 *
 * For example, `blockGraft` does not have an end event, so we use the `cleanup` stage to log the end of the `blockGraft`.
 */
export const LOGS = new FeatureSpec('Logging', {
    blockGraft: {
        stage: 'cleanup',
        details: ({ context }) => ({ type: getBlock(context).subType }),
        action: noaction
    },
    inlineGraft: {
        stage: 'cleanup',
        details: ({ context }) => ({ type: getElement(context).subType }),
        guard: ({ workspace }) => renderIfRegularOrIfHackedIntro(workspace),
        action: noaction
    },
    startChapter: {
        stage: 'fallback',
        details: ({ context }) => ({ c: getElement(context).atts['number'] }),
        guard: ({ workspace }) => renderIfRegularOrIfHackedIntro(workspace),
        action: noaction
    },
    endChapter: {
        stage: 'fallback',
        details: ({ context }) => ({ c: getElement(context).atts['number'] }),
        guard: ({ workspace }) => renderIfRegularOrIfHackedIntro(workspace),
        action: noaction
    }
});
