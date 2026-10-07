import { FeatureSpec, noaction } from '../common';

export const metaContent = new FeatureSpec([
    {
        event: 'metaContent',
        stage: 'fallback',
        action: noaction
    }
]);
