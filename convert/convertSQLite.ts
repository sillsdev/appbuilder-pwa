import { copyFile } from 'fs';
import path from 'path';
import { Task, TaskOutput } from './Task';

export interface SQLiteTaskOutput extends TaskOutput {
    taskName: 'ConvertSQLite';
}

/**
 * Copies data.sqlite to the static folder.
 */
export function convertSQLite(dataDir: string, staticDir: string, verbose: number) {
    const srcFile = path.join(dataDir, 'data.sqlite');
    const dstFile = path.join(staticDir, 'data.sqlite');
    copyFile(srcFile, dstFile, function (err: any) {
        if (err) throw err;
        if (verbose) console.log(`Copied ${srcFile} to ${dstFile}`);
    });
}

export class ConvertSQLite extends Task {
    public triggerFiles: string[] = ['data.sqlite'];

    public async run(verbose: number, outputs: Map<string, TaskOutput>): Promise<TaskOutput> {
        convertSQLite(this.dataDir, this.outDirs.static, verbose);
        return {
            taskName: this.constructor.name,
            files: []
        };
    }
}
