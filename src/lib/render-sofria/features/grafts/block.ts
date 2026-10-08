import { FeatureSpec } from '../../common';
import { getBlock, matchBlock } from '../common';
import { renderBlock } from '../common/grafts';

// NOTE: Are there any other block grafts besides titles and introductions??

export const blockGrafts = new FeatureSpec([
    {
        event: 'blockGraft',
        stage: 'fallback',
        details: ({ context }) => ({ type: getBlock(context).subType }),
        guard: ({ context }) => !matchBlock(context, 'introduction'),
        action: (environment) => renderBlock(environment, getBlock(environment.context).subType)
    }
]);
