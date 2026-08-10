import { scriptureConfig } from '$assets/config';
import { getFeatureValueString } from '$lib/scripts/configUtils';
import * as numerals from '$lib/scripts/numeralSystem';
import { FeatureSpec, RenderScopeLevel, type RenderEnvironment } from './common';

const verseNumberFeature = new FeatureSpec([
    {
        eventTriggers: ['mark'],
        action({ context, workspace }: RenderEnvironment) {
            const element = context.sequences[0].element;

            if (workspace.logSettings.mark) {
                console.log('Mark: SubType %o, Atts: %o', element.subType, element.atts);
            }
            console.warn('Mark: SubType %o, Atts: %o', element.subType, element.atts);

            if (element.subType !== 'verses_label' || !workspace.showVerseNumbers) {
                return;
            }

            workspace.verseRangeNumber = element.atts['number'];
        }
    }
]);

export default verseNumberFeature;
