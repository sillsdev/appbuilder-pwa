import { copyFile } from 'fs';
import path from 'path';
import { TaskOutput, Task } from './Task';

export interface ManifestTaskOutput extends TaskOutput {
    taskName: 'ConvertManifest';
}
/**
 * Copies manifest.webmanifest to static folder
 */
export function convertManifest(dataDir: string, verbose: number) {
    const srcFile = path.join(dataDir, 'manifest.webmanifest');
    const dstFile = path.join('static', 'manifest.webmanifest');
    copyFile(srcFile, dstFile, function (err: any) {
        if (err) throw err;
        if (verbose) console.log(`copied ${srcFile} to ${dstFile}`);
    });
}
export class ConvertManifest extends Task {
    public triggerFiles: string[] = ['manifest.webmanifest'];

    constructor(dataDir: string) {
        super(dataDir);
    }
    public async run(verbose: number, outputs: Map<string, TaskOutput>): Promise<TaskOutput> {
        convertManifest(this.dataDir, verbose);
        return {
            taskName: this.constructor.name,
            files: []
        };
    }
}
