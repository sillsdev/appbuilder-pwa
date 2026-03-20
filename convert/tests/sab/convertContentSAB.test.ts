import { existsSync, readFileSync } from 'fs';
import path from 'path';
import { Script } from 'vm';
import type { ScriptureConfig } from '$config';
import jsdom from 'jsdom';
import { afterAll, beforeAll, expect, test } from 'vitest';
import {
    isTagInnerNestedItem,
    LangContainer,
    LinkMeta,
    parseItemAudio,
    parseItemFeatures,
    parseItemId,
    parseItemImage,
    parseItemLayoutCollection,
    parseItemLayoutMode,
    parseItemLink,
    parseItemSubtitle,
    parseItemTitle,
    parseItemType,
    tagHasInnerNestedItems
} from '../../convertContents';

const dataDir = './data/';

type TestSetup = {
    dom?: jsdom.JSDOM;
    contentsDir?: string;
    hasContentsDir: boolean;
    contentsFile?: string;
    contentsFilePath?: string;
    contentsFileExists: boolean;
    destDir?: string;
    document?: Document;
    verbose: number;
    noTest: boolean;
    scriptureConfig?: ScriptureConfig;
    itemTags?: HTMLCollectionOf<Element>;
};

beforeAll(async () => {
    // TODO: Either extract and verify the files that are needed below exist OR simply verify they exists.
    // TODO: Depends on how we decide to do it.
});

afterAll(async () => {
    //TODO: Delete the contents-xml data clear any testSetup data (if necessary; if not delete this method)
});

// Custom setup and cleaup functions to handle loading different data for specific tests
function setup(
    dataDir: string | undefined,
    useDestDir: boolean,
    fillItemtags: boolean = false,
    verbose: number = 1
): TestSetup {
    // Create TestSetup that the test will then use for core data
    let testSetup: TestSetup = {
        verbose: verbose,
        noTest: false,
        contentsFileExists: false,
        hasContentsDir: false
    };
    let contentsFname: string = 'contents.xml';

    if (dataDir === undefined) {
        dataDir = path.join(process.cwd(), 'data');
    }

    testSetup.contentsDir = path.join(dataDir, 'contents');
    testSetup.hasContentsDir = existsSync(testSetup.contentsDir);

    if (useDestDir) {
        testSetup.destDir = path.join('static', 'contents');
    }

    testSetup.contentsFile = contentsFname;
    testSetup.contentsFilePath = path.join(dataDir, testSetup.contentsFile);
    testSetup.contentsFileExists = existsSync(testSetup.contentsFilePath);

    if (verbose >= 3) {
        console.log(
            `contents.xml exists: ${testSetup.contentsFileExists} at ${testSetup.contentsFilePath}`
        );
    }
    //expect(existsSync(testSetup.contentsFilePath)).toBeTruthy(); // NOTE: This is really only for debugging when you KNOW that you have a Content Menu Items otherwise it will fail multiple times.

    testSetup.scriptureConfig = {} as ScriptureConfig;

    if (testSetup.contentsFileExists) {
        if (verbose >= 3) console.log(`Read Contents file: ${testSetup.contentsFilePath}`);
        testSetup.dom = new jsdom.JSDOM(readFileSync(testSetup.contentsFilePath).toString(), {
            contentType: 'text/xml'
        });

        // Tests that the dom and document exists; otherwise what's the point
        expect(testSetup.dom).not.toSatisfy((r) => r === undefined || r === null);

        const { document } = testSetup.dom.window; // NOTE: It throws an error if you don't handle it with {document} = ...
        testSetup.document = document;

        if (fillItemtags) {
            const itemTag = document.getElementsByTagName('contents-items')[0];
            testSetup.itemTags = itemTag.getElementsByTagName('contents-item');
            expect(testSetup.itemTags).not.toSatisfy((r) => r === undefined);
        }
    }

    return testSetup;
}

function cleanup() {
    //TODO: Determine if this is even needed with the way I am setting this up
}

test('convertContents: Titles if assigned are filled', () => {
    const testSetup: TestSetup = setup(undefined, true, true);
    if (!testSetup.contentsFileExists) {
        //NOTE: This is the best way to be sure that this test does not run if there are no contents.xml (or other files)
        console.warn('Contents file does not exist, so test cannot be run');
        return;
    }

    for (const item of testSetup.itemTags ? testSetup.itemTags : []) {
        const title: LangContainer = parseItemTitle(
            item,
            tagHasInnerNestedItems(item),
            testSetup.verbose
        );

        if (Object.keys(title).length === 0) {
            // Contents items may or may not have titles and both are valid.
            console.log('This item does not have a title');
            continue;
        }

        expect(title.default).not.toSatisfy((r) => r === undefined || r === '');

        if ('tpi' in title) {
            // for some cases with second language
            console.log(`Tok Pisin: ${title['tpi']}`);
            expect(title['tpi']).not.toSatisfy((r) => r === undefined || r === '');
            expect(title['tpi']).toSatisfy((r) => r.toLowerCase() === 'wanpela samting');
        }
    }
});

test('convertContents: Titles handle undefined input', () => {
    const testSetup: TestSetup = setup(undefined, true);
    if (!testSetup.contentsFileExists) {
        //NOTE: This is the best way to be sure that this test does not run if there are no contents.xml (or other files)
        console.warn('Contents file does not exist, so test cannot be run');
        return;
    }

    const titleUpperFalse = parseItemTitle(undefined, false, testSetup.verbose);
    const titleUpperTrue = parseItemTitle(undefined, true, testSetup.verbose);

    expect(Object.keys(titleUpperFalse).length === 0).toBeTruthy();
    expect(Object.keys(titleUpperTrue).length === 0).toBeTruthy();
});

test('convertContents: All Items have an ID', () => {
    const testSetup: TestSetup = setup(undefined, true, true);
    if (!testSetup.contentsFileExists) {
        console.warn('Contents file does not exist, so test cannot be run');
        return;
    }

    for (const item of testSetup.itemTags ? testSetup.itemTags : []) {
        const id = parseItemId(item);
        expect(id).toSatisfy((r) => typeof r === 'number');
        expect(id === 0).toBeFalsy();
    }
});

test('convertContents: Item ID handles undefined input', () => {
    const testSetup: TestSetup = setup(undefined, true);
    if (!testSetup.contentsFileExists) {
        //NOTE: This is the best way to be sure that this test does not run if there are no contents.xml (or other files)
        console.warn('Contents file does not exist, so test cannot be run');
        return;
    }

    const id = parseItemId(undefined);

    expect(id === 0).toBeTruthy();
});

test('convertContents: Subtitles if assigned are filled', () => {
    const testSetup: TestSetup = setup(undefined, true, true);
    if (!testSetup.contentsFileExists) {
        console.warn('Contents file does not exist, so test cannot be run');
        return;
    }

    for (const item of testSetup.itemTags ? testSetup.itemTags : []) {
        const subtitle: LangContainer = parseItemSubtitle(item);

        if (Object.keys(subtitle).length === 0) {
            console.log('This item does not have a subtitle');
            continue;
        }

        expect(subtitle.default).not.toSatisfy((r) => r === undefined || r === '');

        if ('tpi' in subtitle) {
            expect(subtitle['tpi']).not.toSatisfy((r) => r === undefined || r === '');
            expect(subtitle['tpi']).toSatisfy((r) => r.toLowerCase() === 'wanpela samting');
        }
    }
});

test('convertContents: Subtitles handle undefined input', () => {
    const testSetup: TestSetup = setup(undefined, true);
    if (!testSetup.contentsFileExists) {
        //NOTE: This is the best way to be sure that this test does not run if there are no contents.xml (or other files)
        console.warn('Contents file does not exist, so test cannot be run');
        return;
    }

    const subTitle = parseItemSubtitle(undefined);

    expect(Object.keys(subTitle).length === 0).toBeTruthy();
});

test('convertContents: Get Item Type being sure it has not returned None', () => {
    const testSetup: TestSetup = setup(undefined, true, true);
    if (!testSetup.contentsFileExists) {
        console.warn('Contents file does not exist, so test cannot be run');
        return;
    }

    for (const item of testSetup.itemTags ? testSetup.itemTags : []) {
        const itemType = parseItemType(item, tagHasInnerNestedItems(item), undefined);

        expect(itemType).not.toBeUndefined();

        if (itemType === 'grid' || itemType === 'carousel') {
            // Currently grids and carousels have inner items
            expect(tagHasInnerNestedItems(item)).toBeTruthy();
        } else {
            // Currently everything else does not have inner items
            expect(tagHasInnerNestedItems(item)).toBeFalsy();
        }
    }
});

test('convertContents: Get Item Type if it is sent undefined returns undefined', () => {
    const testSetup: TestSetup = setup(undefined, true);
    if (!testSetup.contentsFileExists) {
        console.warn('Contents file does not exist, so test cannot be run');
        return;
    }

    expect(parseItemType(undefined, false, undefined)).toBeUndefined();
    expect(parseItemType(undefined, true, undefined)).toBeUndefined();
});

test('convertContents: Get Item Type send a MOCKED test of a single to be sure that works (the only type which is not listed in type="")', () => {
    const testSetup: TestSetup = setup(undefined, true);
    if (!testSetup.contentsFileExists) {
        console.warn('Contents file does not exist, so test cannot be run');
        return;
    }

    const xml = `
        <contents>
            <contents-items>
                <contents-item id="1">
                    <title lang="default">Single Item 2</title>
                    <subtitle lang="default">Image should be on the right</subtitle>
                    <image-filename>alphabet-1679750_640.jpg</image-filename>
                    <link type="screen" target="2" />
                    <features>
                        <feature name="layout" value="image-right-text-left"/>
                        <feature name="show-reference" value="false"/>
                        <feature name="background" value="default"/>
                        <feature name="padding" value="default"/>
                    </features>
                </contents-item>
            </contents-items>
        </contents>
    `;

    const dom = new jsdom.JSDOM(xml, { contentType: 'text/xml' });
    const { document } = dom.window;

    const testResult = document.getElementsByTagName('contents-item')[0];
    expect(parseItemType(testResult, false, undefined)).toSatisfy((r) => r === 'single');
});

test('convertContents: Get Item Type detect a completely new Menu Item Type', () => {
    // NOTE: This test is intended to catch a new Content Item Type.
    const testSetup: TestSetup = setup(undefined, true, true);
    if (!testSetup.contentsFileExists) {
        console.warn('Contents file does not exist, so test cannot be run');
        return;
    }

    for (const item of testSetup.itemTags ? testSetup.itemTags : []) {
        const testResult = parseItemType(item, tagHasInnerNestedItems(item), undefined);
        expect(testResult).toBeOneOf(['single', 'heading', 'carousel', 'grid']);
    }
});

test('convertContents: Item Features if assigned are filled', () => {
    const testSetup: TestSetup = setup(undefined, true, true);
    if (!testSetup.contentsFileExists) {
        console.warn('Contents file does not exist, so test cannot be run');
        return;
    }

    for (const item of testSetup.itemTags ? testSetup.itemTags : []) {
        const features = parseItemFeatures(item);

        for (const feature of Object.keys(features)) {
            // NOTE: Test the key (feature) and then the value (features[feature])
            expect(feature).not.toSatisfy((r) => r === undefined || r === '');
            expect(features[feature]).not.toSatisfy((r) => r === undefined || r === '');
        }
    }
});

test('convertContents: Item Features handles undefined input', () => {
    const testSetup: TestSetup = setup(undefined, true);
    if (!testSetup.contentsFileExists) {
        console.warn('Contents file does not exist, so test cannot be run');
        return;
    }

    expect(Object.keys(parseItemFeatures(undefined)).length === 0).toBeTruthy();
});

test('convertContents: Images if assigned are filled', () => {
    const testSetup: TestSetup = setup(undefined, true, true);
    if (!testSetup.contentsFileExists) {
        console.warn('Contents file does not exist, so test cannot be run');
        return;
    }

    for (const item of testSetup.itemTags ? testSetup.itemTags : []) {
        const imageFile: string | undefined = parseItemImage(
            item,
            testSetup.contentsDir ? testSetup.contentsDir : '',
            testSetup.verbose,
            testSetup.hasContentsDir
        );

        if (imageFile === undefined) {
            console.log('Image File is undefined');
            continue;
        }

        expect(imageFile).not.toSatisfy((r) => r === '');
    }
});

test('convertContents: Images handle undefined input', () => {
    const testSetup: TestSetup = setup(undefined, true);
    if (!testSetup.contentsFileExists) {
        console.warn('Contents file does not exist, so test cannot be run');
        return;
    }

    const image = parseItemImage(
        undefined,
        testSetup.contentsDir ? testSetup.contentsDir : '',
        testSetup.verbose,
        testSetup.hasContentsDir
    );
    expect(image).toBeUndefined();
});

test('convertContents: Audio filenames if assigned are filled', () => {
    const testSetup: TestSetup = setup(undefined, true, true);
    if (!testSetup.contentsFileExists) {
        console.warn('Contents file does not exist, so test cannot be run');
        return;
    }

    for (const item of testSetup.itemTags ? testSetup.itemTags : []) {
        const audioFile: LangContainer = parseItemAudio(
            item,
            testSetup.contentsDir ? testSetup.contentsDir : '',
            testSetup.destDir ? testSetup.destDir : '',
            testSetup.verbose,
            testSetup.hasContentsDir
        );

        // NOTE: Otherwise this test will fail in a worthless way
        expect(testSetup.contentsDir !== '' && testSetup.destDir !== '').toBeTruthy();

        if (Object.keys(audioFile).length === 0) {
            console.log('This item does not have an audio file');
            continue;
        }

        if (audioFile.default !== undefined) {
            console.log(audioFile.default);
            expect(audioFile.default).not.toSatisfy((r) => r === undefined || r === '');
        }

        for (const key of Object.keys(audioFile)) {
            expect(key).not.toSatisfy((r) => r === undefined || r === '');
            expect(audioFile[key]).not.toSatisfy((r) => r === undefined || r === '');
        }
    }
});

test('convertContents: Audio Items handle undefined input', () => {
    const testSetup: TestSetup = setup(undefined, true);
    if (!testSetup.contentsFileExists) {
        console.warn('Contents file does not exist, so test cannot be run');
        return;
    }

    const audio = parseItemAudio(
        undefined,
        testSetup.contentsDir ? testSetup.contentsDir : '',
        testSetup.destDir ? testSetup.destDir : '',
        testSetup.verbose,
        testSetup.hasContentsDir
    );
    expect(audio).not.toBeUndefined();
    expect(Object.keys(audio).length === 0).toBeTruthy();
});

test('convertContents: Check Links if assigned are filled', () => {
    const testSetup: TestSetup = setup(undefined, true, true);
    if (!testSetup.contentsFileExists) {
        console.warn('Contents file does not exist, so test cannot be run');
        return;
    }

    for (const item of testSetup.itemTags ? testSetup.itemTags : []) {
        const link: LinkMeta = parseItemLink(
            item,
            testSetup.scriptureConfig ? testSetup.scriptureConfig : ({} as ScriptureConfig),
            testSetup.verbose
        );

        if (Object.keys(link).length === 0 || Object.keys(item).length === 0) {
            console.log('This item does not have a link');
            continue;
        }

        expect(link.linkType).not.toSatisfy((r) => r === undefined || r === '');
        if (link.linkType !== 'none') {
            expect(link.linkTarget).not.toSatisfy((r) => r === undefined || r === '');
        }

        //NOTE: LinkMeta.linkLocation might be left around from an older version. I have not yet seen it in the contents.xml of any of the exports I have made.
    }
});

test('convertContents: Check Links if assigned match type with target (that a reference is a reference etc)', () => {
    const testSetup: TestSetup = setup(undefined, true, true);
    if (!testSetup.contentsFileExists) {
        console.warn('Contents file does not exist, so test cannot be run');
        return;
    }

    for (const item of testSetup.itemTags ? testSetup.itemTags : []) {
        const link: LinkMeta = parseItemLink(
            item,
            testSetup.scriptureConfig ? testSetup.scriptureConfig : ({} as ScriptureConfig),
            testSetup.verbose
        );

        if (Object.keys(link).length === 0) {
            console.log('This item does not have a link');
            continue;
        }

        if (link.linkType === 'none') {
            continue;
        }

        //expect(link.linkTarget).not.toBeUndefined();  // Because of having to remove Object.keys(tag).length === 0 on parseItemLink this check will fail

        if (link.linkType === 'reference' && link.linkTarget !== undefined) {
            console.log(link.linkTarget);
            // NOTE: Based on my test data this regex is sufficent, however I only have the Gospels in my testing
            expect(link.linkTarget.match(/^[A-Z]{3}\.[0-9]*\.[0-9]*$/i)).not.toBeNull();
        }

        if (link.linkType === 'screen' && link.linkTarget !== undefined) {
            console.log(link.linkTarget);
            // NOTE: LinkTargets for screens are id numbers of the screen
            expect(link.linkTarget.match(/^[0-9]*$/i));
        }
    }
});

test('convertContents: Check Links handles undefined input', () => {
    const testSetup: TestSetup = setup(undefined, true);
    if (!testSetup.contentsFileExists) {
        console.warn('Contents file does not exist, so test cannot be run');
        return;
    }

    const scriptureConfig = testSetup.scriptureConfig
        ? testSetup.scriptureConfig
        : ({} as ScriptureConfig);
    const link = parseItemLink(undefined, scriptureConfig, testSetup.verbose);

    expect(Object.keys(link).length === 0).toBeTruthy();
});

test('convertContents: Check Links handles Empty Element input', () => {
    const testSetup: TestSetup = setup(undefined, true);
    if (!testSetup.contentsFileExists) {
        console.warn('Contents file does not exist, so test cannot be run');
        return;
    }

    const scriptureConfig = testSetup.scriptureConfig
        ? testSetup.scriptureConfig
        : ({} as ScriptureConfig);
    const link = parseItemLink({} as Element, scriptureConfig, testSetup.verbose);

    expect(Object.keys(link).length === 0).toBeTruthy();
});

test('convertContents: Layout Mode if assgined is not empty', () => {
    const testSetup: TestSetup = setup(undefined, true, true);
    if (!testSetup.contentsFileExists) {
        console.warn('Contents file does not exist, so test cannot be run');
        return;
    }

    for (const item of testSetup.itemTags ? testSetup.itemTags : []) {
        const layoutMode = parseItemLayoutMode(item);
        if (Object.keys(item).length > 0) {
            expect(layoutMode).not.toSatisfy((r) => r === undefined || r === '');
        } else {
            expect(layoutMode).not.toSatisfy((r) => r === '');
        }
    }
});

test('convertContents: Layout Mode handles undefined input', () => {
    const testSetup: TestSetup = setup(undefined, true);
    if (!testSetup.contentsFileExists) {
        console.warn('Contents file does not exist, so test cannot be run');
        return;
    }

    const layoutMode = parseItemLayoutMode(undefined);
    expect(layoutMode).toBeUndefined();
});

test('convertContents: Layout Collection if assgined is not empty', () => {
    const testSetup: TestSetup = setup(undefined, true, true);
    if (!testSetup.contentsFileExists) {
        console.warn('Contents file does not exist, so test cannot be run');
        return;
    }

    for (const item of testSetup.itemTags ? testSetup.itemTags : []) {
        const layoutCollection = parseItemLayoutCollection(item);
        if (layoutCollection !== undefined) {
            // NOTE: tested elsewhere
            expect(layoutCollection?.length > 0).toBeTruthy();
        }
    }
});

test('convertContents: Layout Collection handles undefined input', () => {
    const testSetup: TestSetup = setup(undefined, true);
    if (!testSetup.contentsFileExists) {
        console.warn('Contents file does not exist, so test cannot be run');
        return;
    }

    const layoutCollection = parseItemLayoutCollection(undefined);
    expect(layoutCollection).toBeUndefined();
});

// tagHasInnerNestedItems tests
test('convertContents: Has Inner Nested Items', () => {
    const testSetup: TestSetup = setup(undefined, true, true);
    if (!testSetup.contentsFileExists) {
        console.warn('Contents file does not exist, so test cannot be run');
        return;
    }

    for (const item of testSetup.itemTags ? testSetup.itemTags : []) {
        const testResult: boolean = item.querySelectorAll('contents-item').length > 0;
        console.log(`Item ${item.id} has items beneath it:  ${testResult}`);

        expect(testResult === tagHasInnerNestedItems(item)).toSatisfy((r) => r);
    }
});

test('convertContents: isTagInnerNestedItem return false for undefined', () => {
    const testSetup: TestSetup = setup(undefined, true, true);
    if (!testSetup.contentsFileExists) {
        console.warn('Contents file does not exist, so test cannot be run');
        return;
    }

    expect(isTagInnerNestedItem(undefined)).toBeFalsy();
});

// MOCKED Tests
test('convertcontents: isTagInnerNestedItem returning false for top level contents tag MOCKED', () => {
    const testSetup: TestSetup = setup(undefined, true, false);

    const xml: string = '<contents></contents>';

    const dom = new jsdom.JSDOM(xml, { contentType: 'text/xml' });
    const { document } = dom.window;

    const testResult = document.getElementsByTagName('contents');

    expect(isTagInnerNestedItem(testResult[0])).toBeFalsy();
});

test('convertcontents: isTagInnerNestedItem returning true for not being nested contents tag MOCKED', () => {
    //NOTE: If this test fails the mockup data needs to be verified that it still matches real data
    const testSetup: TestSetup = setup(undefined, true, false);

    // constructed from a real grid, but scaled down. This is to keep the test the same for functionality
    // as it is right now. NOTE: that the title tag with "pick-me" is to faciliatate this test
    const xml: string = ` 
        <contents>
            <contents-items>
                <contents-item id="1" type="grid">
                    <title id="pick-me" lang="default">Correct Title</title>
                    <contents-items>
                        <contents-item id="1">
                            <title lang="default">Too Low</title>
                        </contents-item>
                    </contents-items>
                </contents-item>
            </contents-items>
        </contents>`;

    const dom = new jsdom.JSDOM(xml, { contentType: 'text/xml' });
    const { document } = dom.window;

    const testResult: HTMLElement | null = document.getElementById('pick-me');
    expect(testResult).not.toBeNull();
    if (testResult !== null) {
        expect(testResult?.textContent === 'Correct Title').toSatisfy((r) => r);
        expect(isTagInnerNestedItem(testResult)).toBeFalsy();
    }
});

test('convertcontents: isTagInnerNestedItem returning true for being a nested contents tag MOCKED', () => {
    //NOTE: If this test fails the mockup data needs to be verified that it still matches real data
    const testSetup: TestSetup = setup(undefined, true, false);

    // constructed from a real grid, but scaled down. This is to keep the test the same for functionality
    // as it is right now. NOTE: that the title tag with "pick-me" is to faciliatate this test
    const xml: string = ` 
        <contents>
            <contents-items>
                <contents-item id="1" type="grid">
                    <title lang="default">Too high</title>
                    <contents-items>
                        <contents-item id="1">
                            <title id="pick-me" lang="default">Correct Title</title>
                        </contents-item>
                    </contents-items>
                </contents-item>
            </contents-items>
        </contents>`;

    const dom = new jsdom.JSDOM(xml, { contentType: 'text/xml' });
    const { document } = dom.window;

    const testResult: HTMLElement | null = document.getElementById('pick-me');
    expect(testResult).not.toBeNull();
    if (testResult !== null) {
        expect(testResult?.textContent === 'Correct Title').toSatisfy((r) => r);
        expect(isTagInnerNestedItem(testResult)).toBeTruthy();
    }
});

// tagHasInnerNestedItems tests
test('convertContents: tagHasInnerNestedItems return false for undefined', () => {
    const testSetup: TestSetup = setup(undefined, true, true);
    if (!testSetup.contentsFileExists) {
        console.warn('Contents file does not exist, so test cannot be run');
        return;
    }

    expect(tagHasInnerNestedItems(undefined)).toBeFalsy();
});

test('convertcontents: tagHasInnerNestedItems returning true for having nested contents tag MOCKED', () => {
    //NOTE: If this test fails the mockup data needs to be verified that it still matches real data
    const testSetup: TestSetup = setup(undefined, true, false);

    // constructed from a real grid, but scaled down. This is to keep the test the same for functionality
    // as it is right now. NOTE: that the title tag with "pick-me" is to faciliatate this test
    const xml: string = ` 
        <contents>
            <contents-items>
                <contents-item id="1" type="grid">
                    <title id="pick-me" lang="default">Correct Title</title>
                    <contents-items>
                        <contents-item id="1">
                            <title lang="default">Nested Item</title>
                        </contents-item>
                    </contents-items>
                </contents-item>
            </contents-items>
        </contents>`;

    const dom = new jsdom.JSDOM(xml, { contentType: 'text/xml' });
    const { document } = dom.window;

    const testResult: HTMLElement | undefined = document.getElementById('pick-me') ?? undefined;
    expect(testResult).not.toBeUndefined();
    if (testResult !== undefined && testResult !== null) {
        expect(testResult?.textContent === 'Correct Title').toSatisfy((r) => r);
        expect(tagHasInnerNestedItems(testResult.parentElement ?? undefined)).toBeTruthy();
    }
});

test('convertcontents: tagHasInnerNestedItems returning false for not having nested contents tag MOCKED', () => {
    //NOTE: If this test fails the mockup data needs to be verified that it still matches real data
    const testSetup: TestSetup = setup(undefined, true, false);

    // constructed from a real grid, but scaled down. This is to keep the test the same for functionality
    // as it is right now. NOTE: that the title tag with "pick-me" is to faciliatate this test
    const xml: string = ` 
        <contents>
            <contents-items>
                <contents-item id="1" type="grid">
                    <title lang="default">Level Too high</title>
                    <contents-items>
                        <contents-item id="1">
                            <title id="pick-me" lang="default">Correct Title</title>
                        </contents-item>
                    </contents-items>
                </contents-item>
            </contents-items>
        </contents>`;

    const dom = new jsdom.JSDOM(xml, { contentType: 'text/xml' });
    const { document } = dom.window;

    const testResult: HTMLElement | undefined = document.getElementById('pick-me') ?? undefined;
    expect(testResult).not.toBeUndefined();

    if (testResult !== undefined && testResult !== null) {
        expect(testResult?.textContent === 'Correct Title').toSatisfy((r) => r);
        expect(tagHasInnerNestedItems(testResult.parentElement ?? undefined)).toBeFalsy();
    }
});
