import { existsSync, PathLike, Stats } from 'fs';
import { ConversionParams, ConvertAll } from '../../convertAll';
import path from 'path';
import { TaskOutDirs } from 'Task';
import { test, expect, describe } from 'vitest';
import { mkdir, readdir, readFile, rm, writeFile } from 'fs/promises';
import { compare, CompareFileHandler, Options } from 'dir-compare';
import { fileCompareHandlers } from 'dir-compare';
import { isText } from 'istextorbinary';
import { strFromU8 } from 'fflate';
import { PkBookSpec, PkTestLogger } from '../../convertBooks';

interface TestAppPaths {
    input: string;
    convertExpected: string;
    convertActual: string;
    bookSpecs: string;
    consoleLog: string;
}

interface TestAppOutput {
    bookSpecs: PkBookSpec[];
    consoleLog: string;
}

const testAppsDir = path.join('convert', 'test', 'characterization', 'test_apps');

async function createEmptyDir(path: PathLike) {
    if (existsSync(path)) {
        await rm(path, { recursive: true });
    }
    await mkdir(path, { recursive: true });
}

async function setupTaskOutDirs(base: string): Promise<TaskOutDirs> {
    const dirs = {
        static: path.join(base, 'static'),
        config: path.join(base, 'config'),
        firebase: path.join(base, 'config')
    };
    await createEmptyDir(dirs.static);
    await createEmptyDir(dirs.config);
    await createEmptyDir(dirs.firebase);
    return dirs;
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
    if (actual == expected) return;
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

function listenForOutput(): TestAppOutput {
    const output: TestAppOutput = {
        bookSpecs: [],
        consoleLog: ''
    };
    PkTestLogger.instance().setOnBookCreated((spec) => output.bookSpecs.push(spec));
    console.log = (msg) => (output.consoleLog += msg + '\n');
    process.stdout.write = (msg) => {
        output.consoleLog += msg.toString();
        return true;
    };
    return output;
}

async function runTestApp(outPaths: TestAppPaths, params: ConversionParams) {
    const outSubdirs = await setupTaskOutDirs(outPaths.convertActual);
    const converter = new ConvertAll(params, outSubdirs);
    await converter.run();
}

async function getTestAppOuput(
    params: ConversionParams,
    outPaths: TestAppPaths
): Promise<TestAppOutput> {
    const outputBuffer = listenForOutput();
    await runTestApp(outPaths, params);
    return outputBuffer;
}

async function checkConsoleLog(output: TestAppOutput, paths: TestAppPaths) {
    if (existsSync(paths.consoleLog)) {
        await assertConsoleLogsEqual(paths, output);
    } else {
        await writeFile(paths.consoleLog, output.consoleLog);
    }
}

async function assertConsoleLogsEqual(paths: TestAppPaths, output: TestAppOutput) {
    const expected = await readFile(paths.consoleLog);
    expect(output.consoleLog).toBe(expected.toString());
}

async function checkBookSpecs(output: TestAppOutput, paths: TestAppPaths) {
    if (existsSync(paths.bookSpecs)) {
        await assertBookSpecsEqual(paths, output);
    } else {
        await writeBookSpecs(output, paths);
    }
}

async function writeBookSpecs(output: TestAppOutput, paths: TestAppPaths) {
    const jsonSpecs = JSON.stringify(output.bookSpecs);
    await writeFile(paths.bookSpecs, jsonSpecs);
}

async function assertBookSpecsEqual(paths: TestAppPaths, output: TestAppOutput) {
    const expected = await readJson(paths.bookSpecs);
    assertSetsEqual(output.bookSpecs, expected);
}

async function runAndVerifyTestApp(params: ConversionParams, paths: TestAppPaths) {
    const output = await getTestAppOuput(params, paths);
    await assertConversionsEqual(paths.convertActual, paths.convertExpected);
    await checkBookSpecs(output, paths);
    await checkConsoleLog(output, paths);
}

function getTestPaths(appName: string): TestAppPaths {
    const baseDir = path.join(testAppsDir, appName);
    const outDir = path.join(baseDir, 'output');
    const convertedFilesDir = path.join(outDir, 'convertedFiles');
    return {
        input: path.join(baseDir, 'input'),
        convertExpected: path.join(convertedFilesDir, 'expected'),
        convertActual: path.join(convertedFilesDir, 'actual'),
        bookSpecs: path.join(outDir, 'bookSpecs.json'),
        consoleLog: path.join(outDir, 'log.txt')
    };
}

describe('Test apps', () => {
    test('Test app 1, no watch', async () => {
        const outPaths = getTestPaths('test_app1');

        if (noExpectedOutput(outPaths)) {
            outPaths.convertActual = outPaths.convertExpected;
        }

        const params: ConversionParams = {
            dataDir: outPaths.input,
            watch: false,
            watchTimeout: 0,
            verbose: 0
        };
        await runAndVerifyTestApp(params, outPaths);
    });
});

function noExpectedOutput(outPaths: TestAppPaths) {
    return !existsSync(outPaths.convertExpected);
}
