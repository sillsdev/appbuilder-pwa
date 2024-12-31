import { existsSync, PathLike, Stats } from 'fs';
import { ConversionParams, ConvertAll } from '../convertAll';
import path from 'path';
import { TaskOutDirs } from 'Task';
import { test, expect, describe, beforeAll, beforeEach, afterAll } from 'vitest';
import { mkdir, readdir, readFile, rm, rmdir, stat, writeFile } from 'fs/promises';
import { compare, CompareFileHandler, Options } from 'dir-compare';
import { fileCompareHandlers } from 'dir-compare';
import { isText } from 'istextorbinary';

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

describe('Test apps', () => {
    const compDirs = async function (actual: PathLike, expected: PathLike) {
        const pollOptions = { timeout: 500 };
        const cmpOptions = {
            compareFileSync: adaptiveCompareHandler.compareSync,
            compareFileAsync: adaptiveCompareHandler.compareAsync,
            compareContent: true,
            ignoreLineEnding: true,
            compareTimeStamp: false,
            excludeFilter: '*.pkf,**/collections/catalog/*'
        };
        await expect
            .poll(async () => {
                const result = await compare(actual.toString(), expected.toString(), cmpOptions);
                return result.diffSet?.filter((diff) => diff.state != 'equal');
            }, pollOptions)
            .toEqual([]);
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
        await compDirs(dirActual, dirExpected);
    });
});
