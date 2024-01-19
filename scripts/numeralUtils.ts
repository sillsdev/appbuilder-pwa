import { isNotBlank } from './stringUtils';

export function getIntFromNumberString(str: string): number {
    let result: number = 0;

    try {
        result = parseInt(str, 10);
    } catch (e) {
        // This could be because it was a different numeral system rather than 0...9
        const str0to9: string = convertDigitsInStringToDefaultNumeralSystem(str);
        if (isNotBlank(str0to9)) {
            try {
                result = parseInt(str0to9, 10);
            } catch (e2) {
                // The string contains non-digit characters
            }
        }
    }

    return result;
}

/**
 * Converts digits in the string to the default numeral system
 */
export function convertDigitsInStringToDefaultNumeralSystem(str: string): string {
    const sb: string[] = [];

    for (let i = 0; i < str.length; i++) {
        const ch = str.charAt(i);
        const val = parseInt(ch, 10);
        if (!isNaN(val)) {
            sb.push(val.toString());
        } else {
            sb.push(ch);
        }
    }

    return sb.join('');
}
