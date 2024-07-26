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
        content = content.replace('const firebaseConfig', 'export const firebaseConfig');
        writeFileSync(dstFile, content, 'utf-8');
    } else {
        const firebaseConfig = 'export const firebaseConfig = null;';
        writeFileSync(dstFile, firebaseConfig);
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
