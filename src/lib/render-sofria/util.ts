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
