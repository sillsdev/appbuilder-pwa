import { scriptureConfig } from '$assets/config';
import { getFeatureValueBoolean, getFeatureValueString } from '$lib/scripts/configUtils';
import * as numerals from '$lib/scripts/numeralSystem';
import type { RenderElement } from 'proskomma-json-tools';
import {
    addToScratchPad,
    FeatureSpec,
    type RenderEnvironment,
    type RenderWorkspace
} from './common';

const verseNumberFeature = new FeatureSpec([
    {
        eventTriggers: ['mark'],
        action({ context, workspace }: RenderEnvironment) {
            const element = context.sequences[0].element;
            if (workspace.logSettings.mark) {
                console.log('Mark: SubType %o, Atts: %o', element.subType, element.atts);
            }
            if (element.subType === 'verses_label') {
                if (
                    !workspace.scratch.mark.handledFirstVerse &&
                    workspace.scratch.mark.chapterNumText
                ) {
                    const chapterNumberFormatSetting = getFeatureValueString(
                        scriptureConfig,
                        'chapter-number-format',
                        workspace.references.collection,
                        workspace.references.book
                    );
                    if (chapterNumberFormatSetting === 'drop-cap') {
                        if (!scriptureConfig.mainFeatures['hide-verse-number-1']) {
                            addVerseNumber(workspace, element);
                        }
                    } else {
                        addVerseNumber(workspace, element);
                    }
                } else {
                    addVerseNumber(workspace, element);
                }
                addToScratchPad(workspace.scratch, 'mark', { handledFirstVerse: true });
            }
        }
    }
]);

function addVerseNumber(workspace: RenderWorkspace, element: RenderElement) {
    if (workspace.showVerseNumbers) {
        const spanV = workspace.document.createElement('span');
        spanV.classList.add('v');
        const direction =
            scriptureConfig.bookCollections?.find((x) => x.id === workspace.references.collection)
                ?.style?.textDirection ?? 'ltr';
        // 'number' can be a range of verse numbers
        spanV.innerText = numerals.formatNumberRange(
            workspace.numeralSystem,
            element.atts['number'],
            direction
        );

        const spanVsp = workspace.document.createElement('span');
        spanVsp.classList.add('vsp');
        spanVsp.innerText = '\u00A0'; // &nbsp
        workspace.scopeManager.appendInnerContent(spanV);
        workspace.scopeManager.appendInnerContent(spanVsp);
    }
}

export default verseNumberFeature;
