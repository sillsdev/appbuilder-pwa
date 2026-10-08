import {
    FeatureSpec,
    noaction,
    renderIfRegularOrIfHackedIntro,
    type RenderEnvironment
} from '../common';
import { getSequence, matchSequence } from './common';

export const sequences = new FeatureSpec([
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
