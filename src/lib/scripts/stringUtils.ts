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
export function filenameWithoutPath(filename: string): string {
    let result: string = '';
    if (isNotBlank(filename)) {
        const fname: string = filename.replace('\\', '/');
        result = fname.includes('/') ? fname.substring(fname.lastIndexOf('/') + 1) : fname;
    }
    return result;
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
