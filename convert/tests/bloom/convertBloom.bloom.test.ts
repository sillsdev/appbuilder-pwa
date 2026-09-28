import { existsSync, readdirSync, readFileSync } from 'fs';
import path from 'path';
import jsdom from 'jsdom';
import { describe, expect, test } from 'vitest';
import {
    parseAnalytics,
    parseAudioSources,
    parseBackgroundImages,
    parseBookCollections,
    parseColorThemes,
    parseFeatures,
    parseFirebase,
    parseFonts,
    parseIllustrations,
    parseInterfaceLanguages,
    parseKeys,
    parseLayouts,
    parseMenuItems,
    parseMenuLocalizations,
    parsePlans,
    parseTabTypes,
    parseTraits,
    parseVideos,
    parseWatermarkImages
} from '../../convertConfig';
import { dataDir, getBloomBooks, isBloomProjectLoaded } from './bloomTestUtils';

describe.skipIf(!isBloomProjectLoaded())('bloom project conversion', () => {
    const books = getBloomBooks();
    const dom = new jsdom.JSDOM(readFileSync(path.join(dataDir, 'appdef.xml')).toString(), {
        contentType: 'text/xml'
    });

    const { document } = dom.window;
    const appDefinition = document.getElementsByTagName('app-definition')[0];
    const programType = appDefinition.attributes.getNamedItem('type')!.value;

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

    test('convertConfig: parse color themes', () => {
        const result = parseColorThemes(document, 1);
        expect(result.defaultTheme).not.toSatisfy((r) => r === '' || r === undefined);
        for (const theme of result.themes) {
            expect(theme.name).not.toSatisfy((r) => r === '' || r === undefined);
            const colorsets = theme.colorSets;
            for (const cs of colorsets) {
                const allKeys = Object.keys(cs.colors);
                for (const key of allKeys) {
                    expect(cs.colors[key].match(/^#[a-f0-9]{6}$/i)).not.toBe(null);
                }
            }
        }
    });

    // test.each(books)({
    //     'book convertConfig: parse color themes', () => {
    //     const result = parseColorThemes(document)
    // }
    // });
});
