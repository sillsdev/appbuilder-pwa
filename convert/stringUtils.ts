export function isNotBlank(str: string | null): boolean {
    let result: boolean;
    if (str === null || str === undefined) {
        result = false;
    } else {
        result = str.length > 0 && str.trim().length > 0;
    }
    return result;
}
export function isBlank(str: string | null): boolean {
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

export function hasImageExtension(text: string): boolean {
    return text.match(/\.(png|jpeg|jpg|webp)$/i) !== null;
}

export function hasAudioExtension(text: string): boolean {
    return text.match(/\.(mp3|wav|ogg|webm)$/i) !== null;
}

export function filenameWithoutPath(filename: string): string {
    let result: string = '';
    if (isNotBlank(filename)) {
        const fname: string = filename.replace('\\', '/');
        result = fname.includes('/') ? fname.substring(fname.lastIndexOf('/') + 1) : fname;
    }
    return result;
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
export function stripAllExceptDigitsAndHyphens(input: string): string {
    const sb: string[] = [];

    for (let i = 0; i < input.length; i++) {
        const c: string = input.charAt(i);
        if (/[0-9-]/.test(c)) {
            sb.push(c);
        }
    }

    return sb.join('');
}
export function nextDigits(input: string | null, start: number): string {
    // Returns next digit string starting from the given start pos
    let result: string = '';

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
    const strDigits: string | null = stripNonDigits(input);
    return getFirstDigitsAsInt(strDigits);
}

export function isDigit(c: string): boolean {
    return /\d/.test(c);
}

export function splitString(text: string, separator: string): string[] {
    // More efficient than String.split, since it does not use regex
    const result: string[] = [];

    if (text && text.length > 0) {
        let index1: number = 0;
        let index2: number = text.indexOf(separator);

        while (index2 >= 0) {
            const token: string = text.substring(index1, index2);
            result.push(token);
            index1 = index2 + 1;
            index2 = text.indexOf(separator, index1);
        }

        if (index1 < text.length) {
            result.push(text.substring(index1));
        }
    }

    return result;
}
export function padWithInitialZeros(input: string, length: number): string {
    let result: string = input;

    while (result.length < length) {
        result = '0' + result;
    }

    return result;
}
function ciEqualsInner(a: string, b: string) {
    return a.localeCompare(b, undefined, { sensitivity: 'accent' }) === 0;
}

export function ciEquals(a: any, b: any) {
    if (typeof a !== 'string' || typeof b !== 'string') {
        return a === b;
    }

    //      v--- feature detection
    return ciEqualsInner('A', 'a')
        ? ciEqualsInner(a, b)
        : /*  fallback approach here  */
          a.toUpperCase() === b.toUpperCase();
}

export function splitVersion(version: string): number[] {
    return version.split('.').map(Number);
}

export function compareVersions(version1: string, version2: string): number {
    const v1Components = splitVersion(version1);
    const v2Components = splitVersion(version2);
    const length = Math.max(v1Components.length, v2Components.length);

    for (let i = 0; i < length; i++) {
        const v1Component = v1Components[i] || 0;
        const v2Component = v2Components[i] || 0;

        if (v1Component > v2Component) {
            return 1;
        }
        if (v1Component < v2Component) {
            return -1;
        }
    }

    return 0;
}
