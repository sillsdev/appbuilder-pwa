import type { NumeralSystem } from './numeralSystem';
import { isNotBlank } from './stringUtils';

export function getIntFromNumberString(str: string, numeralSystem: NumeralSystem): number {
    let result: number = 0;

    try {
        result = parseInt(str, 10);
        if (isNaN(result)) {
            throw new Error(`Initial parseInt failed; number in different numeral system?`);
        }
    } catch (e) {
        // This could be because it was a different numeral system rather than 0...9
        const str0to9: string = convertDigitsInStringToDefaultNumeralSystem(str, numeralSystem);
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
export function convertDigitsInStringToDefaultNumeralSystem(
    str: string,
    numeralSystem: NumeralSystem
): string {
    const sb: string[] = [];

    for (let i = 0; i < str.length; i++) {
        const val = str.charCodeAt(i) - numeralSystem.zero.charCodeAt(0);
        if (!isNaN(val) && val >= 0 && val <= 9) {
            sb.push(val.toString());
        } else {
            sb.push(str.charAt(i));
        }
    }

    return sb.join('');
}
