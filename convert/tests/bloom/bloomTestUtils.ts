import { existsSync, readFileSync } from 'fs';
import path from 'path';
import jsdom from 'jsdom';

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
