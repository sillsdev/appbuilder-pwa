import { scriptureConfig } from '$assets/config';
import { getFeatureValueString } from '$lib/scripts/configUtils';
import * as numerals from '$lib/scripts/numeralSystem';
import type { RenderElement } from 'proskomma-json-tools';
import {
    addToScratchPad,
    FeatureSpec,
    type RenderEnvironment,
    type RenderWorkspace
} from '../common';

type MarkScratch = {
    chapterNumText?: string;
    handledFirstVerse?: boolean;
};

export const chapterNumber = new FeatureSpec<{ mark: MarkScratch }>(
    [
        {
            eventTriggers: ['mark'],
            guard: ({ context }) => context.sequences[0].element.subType === 'chapter_label',
            action({ context, workspace }) {
                const element = context.sequences[0].element;
                if (workspace.logSettings.mark) {
                    console.log('Mark: SubType %o, Atts: %o', element.subType, element.atts);
                }
                const chapterNumText = numerals.formatNumber(
                    workspace.numeralSystem,
                    element.atts['number']
                );
                const chapterNumDiv = workspace.document.createElement('div');
                chapterNumDiv.innerText = chapterNumText;

                addToScratchPad(workspace.scratch, 'mark', { chapterNumText });

                const format = getFeatureValueString(
                    scriptureConfig,
                    'chapter-number-format',
                    workspace.references.collection,
                    workspace.references.book
                );
                // NOTE: original rendering code would defer rendering of chapter number until first verse number encountered...
                if (format === 'drop-cap') {
                    chapterNumDiv.classList.add('c-drop');

                    const direction = scriptureConfig.bookCollections?.find(
                        (x) => x.id === workspace.references.collection
                    )?.style?.textDirection;
                    chapterNumDiv.style.float =
                        direction?.toLowerCase() === 'ltr' ? 'left' : 'right';

                    const currentParagraph =
                        workspace.scopeManager.getActiveContentRoot('paragraph');
                    if (currentParagraph) {
                        currentParagraph.className = 'm';
                        currentParagraph.appendChild(chapterNumDiv);
                    }
                } else {
                    chapterNumDiv.classList.add('c');
                    workspace.scopeManager.appendInnerContent(chapterNumDiv, 'document');
                }
            }
        }
    ],
    { tag: 'show-chapter-numbers', enabledValue: 'true' }
);

export const verseNumbers = new FeatureSpec<{ mark: MarkScratch }>(
    [
        {
            eventTriggers: ['mark'],
            guard: ({ context }) => context.sequences[0].element.subType === 'verses_label',
            action({ context, workspace }) {
                const element = context.sequences[0].element;
                if (workspace.logSettings.mark) {
                    console.log('Mark: SubType %o, Atts: %o', element.subType, element.atts);
                }
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
                    addToScratchPad(workspace.scratch, 'mark', { handledFirstVerse: true });
                } else {
                    addVerseNumber(workspace, element);
                }
                
            }
        }
    ],
    { tag: 'show-verse-numbers', enabledValue: 'true' }
);

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
