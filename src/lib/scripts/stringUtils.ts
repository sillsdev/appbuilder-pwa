export function isNotBlank(str: string): boolean {
    let result: boolean;
    if (str === null) {
        result = false;
    } else {
        result = str.length > 0 && str.trim().length > 0;
    }
    return result;
}
export function isBlank(str: string): boolean {
    return !isNotBlank(str);
}
export function getFilenameExt(filename: string): string {
    let extension: string = '';
    if (isNotBlank(filename)) {
        const i = filename.lastIndexOf('.');
        const p = Math.max(filename.lastIndexOf('/'), filename.lastIndexOf('\\'));
        if (i > p) {
            extension = filename.substring(i + 1);
        }
    }
    return extension;
}
export function isPositiveInteger(str: string): boolean {
    let result: boolean;

    if (isBlank(str)) {
        result = false;
    } else {
        result = true;

        for (let i = 0; i < str.length; i++) {
            const c = str.charAt(i);
            if (!isDigit(c)) {
                result = false;
                break;
            }
        }
    }

    return result;
}
export function containsRomanScriptLetter(input: string): boolean {
    return /.*[a-zA-Z].*/.test(input);
}
export function stripNonDigits(input: string | null): string | null {
    if (input === null) {
        return null;
    }

    const sb: string[] = [];

    for (let i = 0; i < input.length; i++) {
        const c = input.charAt(i);
        if (c.charCodeAt(0) > 47 && c.charCodeAt(0) < 58) {
            sb.push(c);
        }
    }

    return sb.join('');
}
export function nextDigits(input: string | null, start: number): string {
    // Returns next digit string starting from the given start pos
    let result: string = "";

    if (input !== null) {
        let numDigits: number = 0;
        let firstDigitPos: number = -1;

        for (let i = start; i < input.length; i++) {
            const c = input.charAt(i);
            if (c.charCodeAt(0) > 47 && c.charCodeAt(0) < 58) {
                if (firstDigitPos < 0) {
                    firstDigitPos = i;
                }
                numDigits++;
            } else if (numDigits > 0) {
                break;
            }
        }

        if (numDigits > 0) {
            result = input.substring(firstDigitPos, firstDigitPos + numDigits);
        }
    }

    return result;
}
export function parseToInt(input: string | null, defaultValue: number): number {
    let result: number;

    if (isBlank(input)) {
        result = defaultValue;
    } else {
        try {
            result = parseInt(input!, 10);
        } catch (ex) {
            result = defaultValue;
        }
    }

    return result;
}
export function getFirstDigits(input: string | null): string {
    return nextDigits(input, 0);
}

export function getFirstDigitsAsInt(input: string | null): number {
    let result: number = 0;
    const digits: string = getFirstDigits(input);

    if (isNotBlank(digits)) {
        result = parseToInt(digits, 0);
    }

    return result;
}
export function getIntFromString(input: string | null): number {
    const strDigits: string = stripNonDigits(input);
    return getFirstDigitsAsInt(strDigits);
}

export function isDigit(c: string): boolean {
    return /\d/.test(c);
}