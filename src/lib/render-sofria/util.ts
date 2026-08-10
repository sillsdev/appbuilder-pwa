import { scriptureConfig } from '$assets/config';
import * as numerals from '$lib/scripts/numeralSystem';
import { parsePhrase, prepareAudioPhraseEndChars } from '$lib/scripts/parsePhrase';
import type { RenderEnvironment, RenderWorkspace } from './common';

function escapeSpecialChars(separators: string) {
    return separators.replace(/[.*+\-?^${}()|[\]\\]/g, '\\$&');
}

export function getSeparatorRegex(inputChars: string) {
    const separators = prepareAudioPhraseEndChars(inputChars);
    let result = '(';
    for (let i = 0; i < separators.length; i++) {
        if (i > 0) {
            result += '|';
        }
        result += escapeSpecialChars(separators[i]);
    }
    result += ')';
    const regEx = new RegExp(result, 'g');
    return regEx;
}

const fnc = 'abcdefghijklmnopqrstuvwxyz';
/** calculate letter index from number
 *
 * 0-25 => a-z; 26+ => aa, ab, ... zz
 */
export function createLetterIndex(index: number) {
    return (
        (index >= fnc.length ? fnc.charAt(Math.floor(index / fnc.length) - 1) : '') +
        fnc.charAt(index % fnc.length)
    );
}

export function subdividePhrases(workspace: RenderWorkspace, text: string) {
    // Only subdivide into phrase divs if we're in a non-intro audio chapter
    if (!workspace.sequenceTypes.includes('introduction') && workspace.references.hasAudio) {
        return parsePhrase(text, workspace.separatorRegex);
    } else {
        return [text];
    }
}

export function addVerseNumberRange(workspace: RenderWorkspace, phraseDiv: HTMLDivElement) {
    console.warn(
        `adding verse number: ${phraseDiv.id === workspace.currentTextPosition.verse + 'a'}; ${workspace.verseRangeNumber}`
    );
    // TODO: parameterize next line
    // TODO: figure out how to hide first verse number
    const direction = scriptureConfig.bookCollections?.find(
        (x) => x.id === workspace.references.collection
    )?.style?.textDirection;

    const spanV = workspace.document.createElement('span');
    spanV.classList.add('v');
    // 'number' can be a range of verse numbers
    spanV.innerText = numerals.formatNumberRange(
        workspace.numeralSystem,
        workspace.verseRangeNumber,
        direction
    );

    const spanVsp = workspace.document.createElement('span');
    spanVsp.classList.add('vsp');
    spanVsp.innerText = '\u00A0'; // &nbsp

    phraseDiv.appendChild(spanV);
    phraseDiv.appendChild(spanVsp);
}

// export function handleVerseLabel(element, showVerseNumbers, workspace) {
//     if (workspace.firstVerse === true && workspace.chapterNumText !== '') {
//         const div = document.createElement('div');
//         const chapterNumberFormatSetting = getFeatureValueString(
//             scriptureConfig,
//             'chapter-number-format',
//             references.collection,
//             references.book
//         );
//         if (chapterNumberFormatSetting === 'drop-cap') {
//             workspace.paragraphDiv.className = 'm';
//             div.classList.add('c-drop');
//             // SAB is statically generating div.c-drop: { float: left|right; } based on settings than can change
//             // So override that style based on the current directin of the text
//             div.style.float = direction.toLowerCase() === 'ltr' ? 'left' : 'right';
//             div.innerText = workspace.chapterNumText;
//             workspace.paragraphDiv.appendChild(div);
//             if (!scriptureConfig.mainFeatures['hide-verse-number-1']) {
//                 addVerseNumber(workspace, element, showVerseNumbers);
//             }
//         } else {
//             // chapter at top of page
//             div.classList.add('c');
//             div.innerText = workspace.chapterNumText;
//             workspace.root.appendChild(div);
//             addVerseNumber(workspace, element, showVerseNumbers);
//         }
//     } else {
//         addVerseNumber(workspace, element, showVerseNumbers);
//     }
//     workspace.firstVerse = false;
// }
