import { FeatureSpec, noaction } from '../common';

export const metaContent = new FeatureSpec('Default', [
    {
        event: 'metaContent',
        stage: 'fallback',
        action: noaction
    }
]);
