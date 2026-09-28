import { existsSync, readdirSync } from 'fs';
import path from 'path';
import { describe, expect, test } from 'vitest';
import { dataDir, getBloomBooks, isBloomProjectLoaded } from './bloomTestUtils';

describe.skipIf(!isBloomProjectLoaded())('bloom project conversion', () => {
    const books = getBloomBooks();

    test('bloom player is copied to static', () => {
        expect(existsSync(path.join('static', 'bloom-player', 'bloom-player'))).toBe(true);
    });

    test.each(books)('book $collectionId/$bookId has source data', ({ collectionId, bookId }) => {
        expect(existsSync(path.join(dataDir, 'books', collectionId, bookId))).toBe(true);
    });

    test.each(books)(
        'book $collectionId/$bookId is converted with a .distribution file',
        ({ collectionId, bookId }) => {
            const collectionDir = path.join('static', 'collections', collectionId);
            const bookDir = readdirSync(collectionDir).find(
                (name) => name === bookId || name.startsWith(`${bookId}.`)
            );
            expect(bookDir).toBeDefined();
            expect(existsSync(path.join(collectionDir, bookDir!, '.distribution'))).toBe(true);
        }
    );
});
