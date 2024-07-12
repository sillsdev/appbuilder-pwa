import { existsSync, copyFile, unlinkSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { TaskOutput, Task } from './Task';

export interface FirebaseTaskOutput extends TaskOutput {
    taskName: 'ConvertFirebase';
}
/**
 * Convert firebase-config.js to module or provide null definition
 */
export function convertFirebase(dataDir: string, verbose: number) {
    const srcFile = path.join(dataDir, 'firebase-config.js');
    const srcExists = existsSync(srcFile);
    const dstFile = path.join('src', 'lib', 'data', 'firebase-config.js');
    if (verbose) console.log(`FirebaseConfig: path=${srcFile}, exists=${srcExists}`);
    if (srcExists) {
        let content = readFileSync(srcFile, 'utf-8');
            // const lines = content.split('\n');
            // if (lines.length > 1 && lines[1].includes('const firebaseConfig') && !lines[1].startsWith('export ')) {
            //     lines[1] = 'export ' + lines[1];
            //     content = lines.join('\n');
            //     writeFileSync(dstFile, content, 'utf-8');
            // }
            // update with string replacement
        content = content.replace("const firebaseConfig", "export const firebaseConfig");
        writeFileSync(dstFile, content, 'utf-8');
    } else {
        if (existsSync(dstFile)) {
            unlinkSync(dstFile);
        }
    }
}

export class ConvertFirebase extends Task {
    public triggerFiles: string[] = ['firebase-config.js'];

    constructor(dataDir: string) {
        super(dataDir);
    }
    public async run(verbose: number) {
        convertFirebase(this.dataDir, verbose);
        return {
            taskName: this.constructor.name,
            files: []
        };
    }
}
