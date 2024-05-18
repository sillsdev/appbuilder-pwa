import { copyFile } from 'fs';
import path from 'path';
import { TaskOutput, Task } from './Task';

export interface AboutTaskOutput extends TaskOutput {
    taskName: 'ConvertAbout';
}
/**
 * Copies about.partial.html to static folder
 */
export function convertAbout(dataDir: string, verbose: number) {
    const srcFile = path.join(dataDir, 'about.partial.html');
    const dstFile = path.join('static', 'about.partial.html');
    copyFile(srcFile, dstFile, function (err: any) {
        if (err) throw err;
        if (verbose) console.log(`copied ${srcFile} to ${dstFile}`);
    });
}
export class ConvertAbout extends Task {
    public triggerFiles: string[] = ['about.partial.html'];

    constructor(dataDir: string) {
        super(dataDir);
    }
    public async run(verbose: number, outputs: Map<string, TaskOutput>): Promise<TaskOutput> {
        convertAbout(this.dataDir, verbose);
        return {
            taskName: this.constructor.name,
            files: []
        };
    }
}
