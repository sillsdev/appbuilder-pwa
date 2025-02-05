import { copyFile, mkdirSync } from 'fs';
import path from 'path';
import { Task, TaskOutput } from './Task';

export interface SQLiteTaskOutput extends TaskOutput {
    taskName: 'ConvertSQLite';
}

/**
 * Copies sqlite-wasm.wasm and data.sqlite to the static folder.
 */
export function convertSQLite(dataDir: string, verbose: number) {
    const srcFileWasm = path.join('node_modules/sql.js/dist', 'sql-wasm.wasm');
    const dstDirWasm = path.join('static', 'wasm');
    const dstFileWasm = path.join(dstDirWasm, 'sql-wasm.wasm');
    mkdirSync(dstDirWasm, { recursive: true });
    copyFile(srcFileWasm, dstFileWasm, function (err: any) {
        if (err) throw err;
        if (verbose) console.log(`Copied ${srcFileWasm} to ${dstFileWasm}`);
    });

    const srcFileData = path.join(dataDir, 'data.sqlite');
    const dstFileData = path.join('static', 'data.sqlite');
    copyFile(srcFileData, dstFileData, function (err: any) {
        if (err) throw err;
        if (verbose) console.log(`Copied ${srcFileData} to ${dstFileData}`);
    });
}

export class ConvertSQLite extends Task {
    public triggerFiles: string[] = ['data.sqlite'];

    constructor(dataDir: string) {
        super(dataDir);
    }

    public async run(verbose: number, outputs: Map<string, TaskOutput>): Promise<TaskOutput> {
        convertSQLite(this.dataDir, verbose);
        return {
            taskName: this.constructor.name,
            files: []
        };
    }
}
