import { existsSync, PathLike } from 'fs';
import { ConversionParams, ConvertAll } from '../convertAll';
import path from 'path';
import { TaskOutDirs } from 'Task';
import { test, expect, describe, beforeAll, beforeEach, afterAll } from 'vitest';
import { mkdir, readdir, readFile, rm, rmdir, stat, writeFile } from 'fs/promises';

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

async function expectAllPathsMatch(
    names: string[],
    actualBase: PathLike,
    expectedBase: PathLike
): Promise<string> {
    for (const file of names) {
        const error = await expectPathsMatch(file, actualBase, expectedBase);
        if (error) {
            return error;
        }
    }
    return '';
}

async function expectPathsMatch(
    head: string,
    actualBase: PathLike,
    expectedBase: PathLike
): Promise<string> {
    const pathActual = path.join(actualBase.toString(), head);
    const pathExpected = path.join(expectedBase.toString(), head);
    const stats = await stat(pathActual);
    if (stats.isFile()) {
        return await expectFilesMatch(pathActual, pathExpected);
    } else {
        return await expectDirsMatch(pathActual, pathExpected);
    }
}

async function expectFilesMatch(pathActual: PathLike, pathExpected: PathLike): Promise<string> {
    const actualContents = await readFile(pathActual);
    const expectedContents = await readFile(pathExpected);
    if (actualContents.equals(expectedContents)) {
        return '';
    }
    return `File contents differ: \n   ${pathActual}\n   ${pathExpected}`;
}

function expectFilenamesMatch(
    acutalNames: string[],
    expectedNames: string[],
    actualBase: string,
    expectedBase: string
): string {
    for (const name of acutalNames) {
        if (!expectedNames.includes(name)) {
            return `Extra file: ${path.join(actualBase, name)}`;
        }
    }
    for (const name of expectedNames) {
        if (!acutalNames.includes(name)) {
            return `Missing file: ${path.join(expectedBase, name)}`;
        }
    }
    return '';
}

async function expectDirsMatch(actual: PathLike, expected: PathLike): Promise<string> {
    const files1 = await readdir(actual);
    const files2 = await readdir(expected);
    const filenameError = expectFilenamesMatch(
        files1,
        files2,
        actual.toString(),
        expected.toString()
    );
    if (filenameError) return filenameError;
    return await expectAllPathsMatch(files1, actual, expected);
}

describe('expectFilesMatch', () => {
    const jibber = '_naonsdfsiodsf';
    const dir1 = path.join(testDir, 'test_dir1' + jibber);
    const dir2 = path.join(testDir, 'test_dir2' + jibber);

    beforeEach(async () => {
        await createEmptyDir(dir1);
        await createEmptyDir(dir2);
    });

    afterAll(async () => {
        await rm(dir1, { recursive: true });
        await rm(dir2, { recursive: true });
    });

    test('empty dirs pass', async () => {
        await expectDirsMatch(dir1, dir2);
    });

    test('extra file throws exception', async () => {
        const filePath = path.join(dir1, 'hello.txt');
        await writeFile(filePath, 'Hello World!');
        const errorMsg = await expectDirsMatch(dir1, dir2);
        expect(errorMsg).toContain(filePath);
        expect(errorMsg).toContain('Extra');
    });

    test('missing file throws exception', async () => {
        const filePath = path.join(dir2, 'hello.txt');
        await writeFile(filePath, 'Hello World!');
        const errorMsg = await expectDirsMatch(dir1, dir2);
        expect(errorMsg).toContain(filePath);
        expect(errorMsg).toContain('Missing');
    });

    test('differing file names is error', async () => {
        const filePath1 = path.join(dir1, 'hello.txt');
        const filePath2 = path.join(dir2, 'goodbye.txt');
        await writeFile(filePath1, 'hello world');
        await writeFile(filePath2, 'hello world');
        const errorMsg = await expectDirsMatch(dir1, dir2);
        expect(errorMsg).toBeTruthy();
    });

    test('differing file contents throws exception', async () => {
        const filePath1 = path.join(dir1, 'hello.txt');
        const filePath2 = path.join(dir2, 'hello.txt');
        await writeFile(filePath1, 'hello world');
        await writeFile(filePath2, 'goodbye world');
        const errorMsg = await expectDirsMatch(dir1, dir2);
        expect(errorMsg).toBeTruthy();
    });

    test('nested directories pass when empty', async () => {
        await mkdir(path.join(dir1, 'foo'));
        await mkdir(path.join(dir2, 'foo'));
        const errorMsg = await expectDirsMatch(dir1, dir2);
        expect(errorMsg).toBeFalsy();
    });

    test('nested directories do not match', async () => {
        await mkdir(path.join(dir1, 'foo'));
        await mkdir(path.join(dir2, 'foo'));
        await writeFile(path.join(dir2, 'foo', 'hello.txt'), 'hello world');
        const errorMsg = await expectDirsMatch(dir1, dir2);
        expect(errorMsg).toBeTruthy();
    });
});

describe('Test apps', () => {
    expect.extend({
        toMatchDirectory: async (actual: PathLike, expected: PathLike) => {
            const error = await expectDirsMatch(actual, expected);
            return {
                message: () => error,
                pass: error.length > 0
            };
        }
    });

    const compDirs = async function (actual: PathLike, expected: PathLike) {
        const assertion: any = expect(actual);
        await assertion.toMatchDirectory(expected);
    };

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
        const converter = new ConvertAll(params, outDirs);
        await converter.run();
        compDirs(dirActual, dirExpected);
    });
});
