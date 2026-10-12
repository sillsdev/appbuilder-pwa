import { FeatureSpec, noaction, renderIfRegularOrIfHackedIntro } from '../common';
import { getBlock, getElement } from './common';

/**
 * Events that are just here for logging purposes.
 *
 * For example, `blockGraft` does not have an end event, so we use the `cleanup` stage to log the end of the `blockGraft`.
 */
export const LOGS = new FeatureSpec('Logging', [
    {
        event: 'blockGraft',
        stage: 'cleanup',
        details: ({ context }) => ({ type: getBlock(context).subType }),
        action: noaction
    },
    {
        event: 'inlineGraft',
        stage: 'cleanup',
        details: ({ context }) => ({ type: getElement(context).subType }),
        guard: ({ workspace }) => renderIfRegularOrIfHackedIntro(workspace),
        action: noaction
    }
]);
