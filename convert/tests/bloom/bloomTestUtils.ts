import { existsSync, readdirSync, readFileSync } from 'fs';
import path from 'path';
import jsdom from 'jsdom';
import { BLOOM_REF_REGEXES } from '../../convertBooks';

export const dataDir = './data/';

export type BloomBookRef = {
    collectionId: string;
    bookId: string;
};

export function loadAppDef(): Document | undefined {
    const appDefPath = path.join(dataDir, 'appdef.xml');
    if (!existsSync(appDefPath)) {
        return undefined;
    }
    return new jsdom.JSDOM(readFileSync(appDefPath).toString(), { contentType: 'text/xml' }).window
        .document;
}

export function getBloomBooks(document: Document | undefined = loadAppDef()): BloomBookRef[] {
    if (!document) {
        return [];
    }
    return Array.from(document.getElementsByTagName('book'))
        .filter((book) => book.getAttribute('type') === 'bloom-player')
        .map((book) => ({
            collectionId: book.closest('books')?.getAttribute('id') ?? '',
            bookId: book.getAttribute('id') ?? ''
        }));
}

export function isBloomProjectLoaded(): boolean {
    return getBloomBooks().length > 0;
}

export function walkFiles(dir: string): string[] {
    return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
        const entryPath = path.join(dir, entry.name);
        return entry.isDirectory() ? walkFiles(entryPath) : [entryPath];
    });
}

export function walkNames(dir: string): string[] {
    return readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
        entry.isDirectory() ? [entry.name, ...walkNames(path.join(dir, entry.name))] : [entry.name]
    );
}

export function extractRefs(content: string): string[] {
    return BLOOM_REF_REGEXES.flatMap((regex) => Array.from(content.matchAll(regex), (m) => m[2]));
}

export function isLocalRef(ref: string): boolean {
    return ref !== '' && !/^(?:[a-z][a-z0-9+.-]*:|#|\/)/i.test(ref);
}

export function safeDecode(value: string): string {
    try {
        return decodeURIComponent(value);
    } catch {
        return value;
    }
}

export function refToPath(ref: string): string {
    return safeDecode(ref.split(/[?#]/)[0]);
}
