import { readFileSync } from 'fs';
import path from 'path';
import type { ScriptureConfig } from '$config';
import jsdom from 'jsdom';
import { expect, test } from 'vitest';
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
    parseTraits,
    parseVideos,
    parseWatermarkImages
} from '../../convertConfig';

const dataDir = './data/';
const dom = new jsdom.JSDOM(readFileSync(path.join(dataDir, 'appdef.xml')).toString(), {
    contentType: 'text/xml'
});
const { document } = dom.window;

const appDefinition = document.getElementsByTagName('app-definition')[0];
const programType = appDefinition.attributes.getNamedItem('type')!.value;

test('convertConfig: parse fonts', () => {
    const result = parseFonts(document, 1);
    for (const f of result) {
        expect(f.family).not.toSatisfy((r) => r === '' || r === undefined);
        //CHECK WITH CHRIS FOR EMPTY FONT NAMES
        //expect(f.name).not.toSatisfy((r) => r === "" || r === undefined);
        expect(f.file).not.toSatisfy((r) => r === '' || r === undefined);
        expect(f.fontStyle).not.toSatisfy((r) => r === '' || r === undefined);
        expect(f.fontWeight).not.toSatisfy((r) => r === '' || r === undefined);
    }
});

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

test('convertConfig: parse interface languages', () => {
    const result = parseInterfaceLanguages(document, {} as ScriptureConfig, 1);

    for (const lang in result.writingSystems) {
        expect(result.writingSystems[lang].fontFamily).not.toEqual('');
        expect(result.writingSystems[lang].textDirection).toSatisfy(
            (r) => r === 'LTR' || r === 'RTL'
        );
        //expect(Object.keys(result.writingSystems[lang].displayNames).length).toEqual(Object.keys(result.writingSystems).length);
    }
});

test('convertConfig: parse firebase', () => {
    const result = parseFirebase(document, 1);
    expect(Object.keys(result.features)).not.toHaveLength(0);
});

if (programType === 'DAB') {
    test('Dummy test for SAB testing for DAB file', () => {
        expect(0).toEqual(0);
    });
} else if (programType === 'SAB') {
    test('convertConfig: parse traits', () => {
        const result = parseTraits(document, 'dummy', 1);
        expect(Object.keys(result)).toHaveLength(7);
    });

    test('convertConfig: parse book collections', () => {
        const result = parseBookCollections(document, 1);
        expect(result).not.toHaveLength(0);
        for (const bookCol in result) {
            const bc = result[bookCol];
            expect(Object.keys(bc)).toHaveLength(13);
            expect(bc.id).not.toBe('');
            expect(bc.collectionName).not.toBe('');
            expect(bc.collectionAbbreviation).not.toBe('');
            expect(bc.collectionImage).not.toBe('');
            expect(bc.languageCode).not.toBe('');
            expect(bc.languageName).not.toBe('');

            expect(Object.keys(bc.features).length).toBeGreaterThanOrEqual(39);

            expect(bc.books).not.toHaveLength(0);
            for (const bk in bc.books) {
                const bkk = bc.books[bk];
                expect(bkk.chapters).not.toBe(0 || undefined);
                expect(bkk.chaptersN).not.toSatisfy((r) => r === '' || r === undefined);
                expect(bkk.id).not.toSatisfy((r) => r === '' || r === undefined);
                expect(bkk.name).not.toSatisfy((r) => r === '' || r === undefined);
                expect(bkk.section).not.toSatisfy((r) => r === '' || r === undefined);
                expect(bkk.testament).not.toSatisfy((r) => r === '' || r === undefined);
                expect(bkk.abbreviation).not.toSatisfy((r) => r === '' || r === undefined);
                expect(bkk.file).not.toSatisfy((r) => r === '' || r === undefined);

                for (const audio in bkk.audio) {
                    expect(bkk.audio[audio].num).not.toSatisfy((r) => r === '' || r === undefined);
                    expect(bkk.audio[audio].filename).not.toSatisfy(
                        (r) => r === '' || r === undefined
                    );
                    expect(bkk.audio[audio].len).not.toSatisfy((r) => r === '' || r === undefined);
                    expect(bkk.audio[audio].size).not.toSatisfy((r) => r === '' || r === undefined);
                    expect(bkk.audio[audio].src).not.toSatisfy((r) => r === '' || r === undefined);
                    expect(bkk.audio[audio].timingFile).not.toSatisfy(
                        (r) => r === '' || r === undefined
                    );
                }
            }

            expect(Object.keys(bc.style)).toHaveLength(6);

            let ind = 0;
            for (const style in bc.styles) {
                const st = bc.styles[ind];
                expect(st.name).not.toSatisfy((r) => r === '' || r === undefined);
                expect(Object.keys(st.properties)).not.toHaveLength(0);
                ind += 1;
            }
        }
    });

    test('convertConfig: parse keys', () => {
        const result = parseKeys(document, 1);
        //expect(result).not.toHaveLength(0);
        for (const k of result) {
            expect(k).not.toSatisfy((r) => r === '' || r === undefined);
        }
    });

    test('convertConfig: parse analytics', () => {
        const result = parseAnalytics(document, 1);
        for (const p in result.providers) {
            expect(p).not.toSatisfy((r) => r === '' || r === undefined);
            //for (const provider in p) {
            //    expect(provider).not.toSatisfy((r) => r === "" || r === undefined);
            //}
        }
    });

    test('convertConfig: parse audio sources', () => {
        const result = parseAudioSources(document, 1);
        expect(result).not.toBe(undefined);

        // no audio yet
    });

    test('convertConfig: parse videos', () => {
        const result = parseVideos(document, 1);
        expect(result).not.toBe(undefined);

        // not video yet
    });

    test('convertConfig: parse illustrations', () => {
        const result = parseIllustrations(document, 1);
        expect(result).not.toBe(undefined);

        // no illustrations yet
    });

    test('convertConfig: parse layouts', () => {
        const result = parseLayouts(document, 1, 1);
        expect(result.layouts).not.toHaveLength(0);
        for (const layout of result.layouts) {
            expect(layout.mode).not.toSatisfy((r) => r === '' || r === undefined);
            expect(layout.layoutCollections).not.toHaveLength(0);
            for (const lc of layout.layoutCollections) {
                expect(lc).not.toSatisfy((r) => r === '' || r === undefined);
            }
            for (const lc of Object.keys(layout.features)) {
                expect(layout.features[lc]).not.toSatisfy((r) => r === '' || r === undefined);
            }
        }
    });

    test('convertConfig: parse features', () => {
        const result = parseFeatures(document, 1);
        expect(Object.keys(result)).toHaveLength(140);
    });

    test('convertConfig: parse background images', () => {
        const result = parseBackgroundImages(document, 1);
        expect(result).not.toBe(undefined);

        // none yet
    });

    test('convertConfig: parse watermark images', () => {
        const result = parseWatermarkImages(document, 1);
        expect(result).not.toBe(undefined);

        // none yet
    });

    test('convertConfig: parse menu items', () => {
        const result = parseMenuItems(document, '', 1);
        expect(result).not.toBe(undefined);

        // none yet
    });

    test('convertConfig: parse plans', () => {
        const result = parsePlans(document, 1);
        expect(result).not.toBe(undefined);

        // none yet
    });
} else {
    throw new Error(`Unsupported program type parsed: ${programType}`);
}
