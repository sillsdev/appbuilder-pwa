import { existsSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { Task, TaskOutput } from './Task';

export interface FirebaseTaskOutput extends TaskOutput {
    taskName: 'ConvertFirebase';
}
/**
 * Convert firebase-config.js to module or provide null definition
 */
export function convertFirebase(dataDir: string, verbose: number) {
    const srcFile = path.join(dataDir, 'firebase-config.js');
    const srcExists = existsSync(srcFile);
    const dstFile = path.join('src', 'gen-assets', 'firebase-config.ts');
    if (verbose) {
        console.log(`FirebaseConfig: path=${srcFile}, exists=${srcExists}`);
    }
    const prefix = `import type { FirebaseOptions } from 'firebase/app';\nexport const firebaseConfig: Readonly<FirebaseOptions> | null`;
    if (srcExists) {
        let content = readFileSync(srcFile, 'utf-8');
        content = content.replace('const firebaseConfig', prefix);
        writeFileSync(dstFile, content, 'utf-8');
    } else {
        const firebaseConfig = `${prefix} = null`;
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
