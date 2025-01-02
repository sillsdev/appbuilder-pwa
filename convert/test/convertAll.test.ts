import { existsSync, PathLike, Stats } from 'fs';
import { ConversionParams, ConvertAll } from '../convertAll';
import path from 'path';
import { TaskOutDirs } from 'Task';
import { test, expect, describe, beforeAll, beforeEach, afterAll } from 'vitest';
import { mkdir, readdir, readFile, rm, rmdir, stat, writeFile } from 'fs/promises';
import { compare, CompareFileHandler, DiffSet, Options } from 'dir-compare';
import { fileCompareHandlers } from 'dir-compare';
import { isText } from 'istextorbinary';
import { strFromU8 } from 'fflate';
import { PkBookSpec, PkTestLogger } from '../convertBooks';
import { testApp1Books } from './bookSpecs/testApp1Books';

const testDir = path.join('convert', 'test_apps');

async function createEmptyDir(path: PathLike) {
    if (existsSync(path)) {
        await rm(path, { recursive: true });
    }
    await mkdir(path);
}

async function setupOutDirs(outDirs: TaskOutDirs) {
    await createEmptyDir(outDirs.static);
    await createEmptyDir(outDirs.config);
    await createEmptyDir(outDirs.firebase);
}

/**
 * Use line-based comparison for text files only
 */
const adaptiveCompareHandler: CompareFileHandler = {
    compareSync: function (
        path1: string,
        stat1: Stats,
        path2: string,
        stat2: Stats,
        options: Options
    ): boolean {
        const handler = isText(path1)
            ? fileCompareHandlers.lineBasedFileCompare.compareSync
            : fileCompareHandlers.defaultFileCompare.compareSync;
        return handler(path1, stat1, path2, stat2, options);
    },
    compareAsync: function (
        path1: string,
        stat1: Stats,
        path2: string,
        stat2: Stats,
        options: Options
    ): Promise<boolean> {
        const handler = isText(path1)
            ? fileCompareHandlers.lineBasedFileCompare.compareAsync
            : fileCompareHandlers.defaultFileCompare.compareAsync;
        return handler(path1, stat1, path2, stat2, options);
    }
};

async function assertDirsEqual(actual: PathLike, expected: PathLike, excludeFilter: string) {
    const pollOptions = { timeout: 500 };
    const cmpOptions = {
        compareFileSync: adaptiveCompareHandler.compareSync,
        compareFileAsync: adaptiveCompareHandler.compareAsync,
        compareContent: true,
        ignoreLineEnding: true,
        compareTimeStamp: false,
        excludeFilter
    };
    await expect
        .poll(async () => {
            const result = await compare(actual.toString(), expected.toString(), cmpOptions);
            return result.diffSet?.filter((diff) => diff.state != 'equal');
        }, pollOptions)
        .toEqual([]);
}

function maskDocIds(catalog: any) {
    catalog.documents = catalog.documents?.map((doc: any) => (doc.id = 'xxx'));
}

async function readJson(filePath: string) {
    const contents = await readFile(filePath);
    return JSON.parse(strFromU8(contents));
}

async function assertCatalogFilesEqual(
    filenames: string[],
    actualCatalog: string,
    expectedCatalog: string
) {
    for (const file of filenames) {
        const actual = await readJson(path.join(actualCatalog, file));
        const expected = await readJson(path.join(expectedCatalog, file));
        maskDocIds(actual);
        maskDocIds(expected);
        expect(actual).toEqual(expected);
    }
}

function catalogDir(conversionDir: PathLike) {
    return path.join(conversionDir.toString(), 'static', 'collections', 'catalog');
}

async function assertCatalogsEqual(actualConversion: PathLike, expectedConversion: PathLike) {
    const actualCatalog = catalogDir(actualConversion);
    const expectedCatalog = catalogDir(expectedConversion);
    const actualFiles = await readdir(actualCatalog);
    const expectedFiles = await readdir(expectedCatalog);
    expect(actualFiles).toEqual(expectedFiles);
    await assertCatalogFilesEqual(actualFiles, actualCatalog, expectedCatalog);
}

async function assertConversionsEqual(actual: PathLike, expected: PathLike) {
    const excludeFilter = '*.pkf,**/collections/catalog/*';
    await assertDirsEqual(actual, expected, excludeFilter);
    await assertCatalogsEqual(actual, expected);
}

function assertSetsEqual(actual: any[], expected: any[]) {
    expect(actual.length).toBe(expected.length);
    for (const item of expected) {
        expect(actual).toContainEqual(item);
    }
}

describe('Test apps', () => {
    test('Test app 1, no watch', async () => {
        const baseDir = path.join(testDir, 'test_app1');
        const dirActual = path.join(baseDir, 'actual');
        const dirExpected = path.join(baseDir, 'expected');
        const params: ConversionParams = {
            dataDir: path.join(baseDir, 'input'),
            watch: false,
            watchTimeout: 0,
            verbose: 0
        };
        const outDirs: TaskOutDirs = {
            static: path.join(dirActual, 'static'),
            config: path.join(dirActual, 'config'),
            firebase: path.join(dirActual, 'config')
        };
        await setupOutDirs(outDirs);

        // Capture book input to Proskomma
        const bookSpecs: PkBookSpec[] = [];
        PkTestLogger.instance().setOnBookCreated((spec) => bookSpecs.push(spec));

        const converter = new ConvertAll(params, outDirs);
        await converter.run();
        await assertConversionsEqual(dirActual, dirExpected);

        assertSetsEqual(bookSpecs, testApp1Books);
    });
});
