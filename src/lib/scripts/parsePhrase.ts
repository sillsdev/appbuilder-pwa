const closingSpeechChars = '\u2019\u201D\u00BB\u203A"'; // end of speech chars, including "
const closingSpeechCharsAfterSpace = '\u2019\u201D\u00BB\u203A'; // end of speech chars after space, not including "
const closingParenthesisChars = ')]';

export const parsePhrase = (inner: any, seprgx: RegExp) => {
    const phrases = [];
    const len = inner.length;
    let pos = 0;
    let phrase = '';
    while (pos < len) {
        const c = inner.charAt(pos);
        phrase += c;
        let foundPhraseEndChar = isPhraseEndingChar(c, seprgx);
        if (foundPhraseEndChar) {
            foundPhraseEndChar = !char_is_number_separator(inner, pos);
        }
        if (foundPhraseEndChar) {
            foundPhraseEndChar = !char_starts_phrase(inner, pos);
        }
        if (foundPhraseEndChar) {
            // Not sure if we'll see this one but left it in
            foundPhraseEndChar = !char_ends_html(phrase, pos);
        }
        if (foundPhraseEndChar) {
            if (c === ' ') {
                // Space as phrase end char
                // We don't want the space highlighted, so move back one character
                phrase = phrase.slice(0, -1);
                pos--;
            } else if (c === '\u0591') {
                // Hebrew atnah
                // Instead of employing sentence and phrase punctuation, all verses of Hebrew Scripture
                // contain either one or two communication units.
                // Most verses contain two of these units (there can never be more than two).
                // An "atnah," or vertical wedge ^, marks the end of the first communication unit.
                // The placement of the atnah in Hebrew, however, is under the first consonant
                // of the last syllable in the first communication unit.

                // Collect up more letters until we reach a word break
                // TODO: this needs to be checked at some point. I'm not sure if the letter check
                // here is sufficiently the same as the Character.isAlphabetic in the java code
                while (pos < len - 1 && char_is_letter(inner.charAt(pos + 1))) {
                    phrase += inner.charAt(pos + 1);
                    pos++;
                }
            }

            if (pos < len - 1) {
                let nextChar1 = pos < len - 1 ? inner.charAt(pos + 1) : 0;
                let nextChar2 = pos < len - 2 ? inner.charAt(pos + 2) : 0;
                while (
                    isClosingSpeechChar(nextChar1) ||
                    isClosingSpeechCharAfterSpace(nextChar1) ||
                    (nextChar1 !== ' ' && isPhraseEndingChar(nextChar1, seprgx)) ||
                    (nextChar1 === ' ' &&
                        (isClosingSpeechCharAfterSpace(nextChar2) ||
                            isClosingParenthesisChar(nextChar2)))
                ) {
                    if (nextChar1 === ' ') {
                        // Next string was a space and then a closing speech character or closing parenthesis
                        phrase += nextChar1;
                        phrase += nextChar2;
                        pos += 2;
                    } else {
                        phrase += nextChar1;
                        pos++;
                    }
                    if (pos < len - 1) {
                        nextChar1 = pos < len - 1 ? inner.charAt(pos + 1) : 0;
                        nextChar2 = pos < len - 2 ? inner.charAt(pos + 2) : 0;
                    } else {
                        break;
                    }
                }
            }
            // If there are 3 or fewer characters left in the phrase, collect them up
            if (len - pos < 4) {
                phrase += inner.substring(pos + 1);
                pos = len - 1;
            }

            // Collect up any spaces.
            while (pos < len - 1 && inner.charAt(pos + 1) === ' ') {
                phrase += ' ';
                pos++;
            }
            phrases.push(phrase);
            phrase = '';
        }
        pos++;
    }
    // If unterminated phrase present, add it to list
    if (phrase.trim() !== '') {
        phrases.push(phrase);
    }
    return phrases;
};
export function prepareAudioPhraseEndChars(inputChars: string) {
    let chars = inputChars;
    // remove spaces
    chars = chars.replaceAll(' ', '');
    // convert \s to spaces
    chars = chars.replace('\\s', ' ');
    // convert \uABCD to Unicode chars
    chars = convertCharCodesToString(chars);
    return chars;
}
function convertCharCodesToString(inputChars: string) {
    let chars = inputChars;
    // \uABCD format
    // The line below was:
    // const regxuABCD = new RegExp('(?<!\\\\)\\\\u([0-9a-fA-F]+)', 'g');
    // The negative look behind in the expression was not supported by Safari
    // until 2 days ago so we removed it for now.  It should not cause
    // a significant issue with the config lines we are parsing now, but
    // it may be a good idea to put this back in in the future to catch
    // entries starting with a double back slash.
    const regxuABCD = new RegExp('\\\\u([0-9a-fA-F]+)', 'g');
    let match = regxuABCD.exec(chars);
    let matches = [];
    while (match) {
        matches.push(match[0]);
        match = regxuABCD.exec(chars);
    }
    for (let i = 0; i < matches.length; i++) {
        const hexString = matches[i].substring(2);
        const hexToDecimal = parseInt(hexString, 16);
        const replace = String.fromCharCode(hexToDecimal);
        chars = chars.replaceAll(matches[i], replace);
    }
    // U+1234 format
    if (chars.includes('U+')) {
        const regxu1234 = new RegExp('U\\+([0-9a-fA-F]+)', 'g');
        matches = [];
        match = regxu1234.exec(chars);
        while (match) {
            matches.push(match[0]);
            match = regxu1234.exec(chars);
        }
        for (let i = 0; i < matches.length; i++) {
            const hexString = matches[i].substring(2);
            const hexToDecimal = parseInt(hexString, 16);
            const replace = String.fromCharCode(hexToDecimal);
            chars = chars.replaceAll(matches[i], replace);
        }
    }
    return chars;
}
const char_is_numeric = (c: string) => {
    return /^\d$/.test(c);
};
const char_is_letter = (c: string) => {
    return /^\p{L}/u.test(c);
};
const char_is_number_separator = (text: string, pos: number) => {
    let isNumberSeparator = false;
    const numberMedialPunctuation = '.,:-;';
    if (pos > 0 && pos < text.length - 4) {
        // 1. Comma is being used as a thousands separator in a number e.g. 200,000
        // 2. Full stop is being used as a decimal marker, e.g. 1.2
        // 3. Colon is being used to separate chapter and verse in a Scripture reference, e.g. 5:2
        // 4. Comma is being used to separate verse ranges in a Scripture reference, e.g. 4:6, 9.
        const c = text.charAt(pos);
        if (numberMedialPunctuation.indexOf(c) >= 0) {
            const prevc = text.charAt(pos - 1);
            if (char_is_numeric(prevc)) {
                const nextc = text.charAt(pos + 1);
                const nextc1 = text.charAt(pos + 2);
                if (char_is_numeric(nextc) || (nextc == ' ' && char_is_numeric(nextc1))) {
                    isNumberSeparator = true;
                }
            }
        }
    }
    return isNumberSeparator;
};
const char_starts_phrase = (text: string, pos: number) => {
    // In the Solomon Islands, ? and ! can mark the start of a phrase.
    // e.g. “!Yu stanap, tekem bed blong yu an wakabaot gobaek long haos blong yu!”
    // We want to make sure that these chars are not followed by an alphabetic character.
    let startsPhrase = false;
    const c = text.charAt(pos);
    if (pos < text.length - 2) {
        if (c === '!' || c === '?') {
            const nextChar = text.charAt(pos + 1);
            if (char_is_letter(nextChar)) {
                startsPhrase = true;
            }
        }
    }
    return startsPhrase;
};

const char_ends_html = (phrase: string, pos: number) => {
    // If char is a semi-colon, make sure it is not an HTML code such as &nbsp; &lt; &gt;
    let endsHtml = false;
    const c = phrase.charAt(pos);
    if (c === ';') {
        const ampPos = phrase.lastIndexOf('&');
        if (ampPos >= 0) {
            if (phrase.length - ampPos < 8) {
                const seq = phrase.slice(ampPos);
                if (seq === '&nbsp;' || seq === '&lt;' || seq === '&gt;') {
                    endsHtml = true;
                }
            }
        }
    }
    return endsHtml;
};
const isClosingSpeechChar = (c: string) => {
    return closingSpeechChars.indexOf(c) >= 0;
};
const isClosingSpeechCharAfterSpace = (c: string) => {
    return closingSpeechCharsAfterSpace.indexOf(c) >= 0;
};
const isClosingParenthesisChar = (c: string) => {
    return closingParenthesisChars.indexOf(c) >= 0;
};
const isPhraseEndingChar = (c: string, seprgx: RegExp) => {
    return c.match(seprgx) != null;
};
