import { ciEquals } from './stringUtils';

export function verifyGlossaryEntries(content: string, glossary: string[]): string {
    // Regular expression pattern
    const regex = /\\w\s*([^\\]+)\s*\\w\*/;
    let result: string = '';
    result = content;
    const sb = [];
    let inputString = content;
    let match;
    // Loop through all matches
    while ((match = regex.exec(inputString)) !== null) {
        // Append text segment with 1st part of string
        sb.push(inputString.substring(0, match.index));
        // match[1] contains the text between \k and \k*
        const matchWord = entryToMatch(match[1]);
        const originalEntry: string = match[0];
        const textOnlyEntry: string = textFromMatch(match[1]);
        let matchFound = false;
        glossary.every((glossaryEntry) => {
            if (ciEquals(glossaryEntry.trim(), matchWord)) {
                matchFound = true;
                return false;
            }
            return true;
        });
        if (matchFound) {
            sb.push(originalEntry);
        } else {
            sb.push(textFromMatch(textOnlyEntry));
        }
        const oldLength = inputString.length;
        inputString = inputString.substring(match.index + match[0].length);
    }
    sb.push(inputString);
    result = sb.join('');
    return result;
}
function entryToMatch(match: string): string {
    let result: string;
    const parts = match.split('|');
    if (parts.length > 1) {
        result = parts[1].trim();
    } else {
        result = parts[0].trim();
    }
    return result;
}
function textFromMatch(match: string): string {
    const parts = match.split('|');
    return parts[0];
}
