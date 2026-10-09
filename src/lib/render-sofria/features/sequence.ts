import { FeatureSpec, noaction, renderIfRegularOrIfHackedIntro } from '../common';
import { getSequence } from './common';

export const sequences = new FeatureSpec('Default', [
    {
        event: 'startSequence',
        stage: 'fallback',
        details: ({ context }) => ({ type: getSequence(context).type }),
        guard: ({ workspace }) => renderIfRegularOrIfHackedIntro(workspace),
        action: noaction
    },
    {
        event: 'endSequence',
        stage: 'fallback',
        details: ({ context }) => ({ type: getSequence(context).type }),
        guard: ({ workspace }) => renderIfRegularOrIfHackedIntro(workspace),
        action: noaction
    }
]);
