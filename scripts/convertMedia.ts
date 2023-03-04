import { CopyOptions, cpSync } from 'fs';
import path from 'path';
import { Task, TaskOutput } from './Task';

function cpSyncOptional(source: string, destination: string, opts?: CopyOptions): boolean {
    try {
        cpSync(source, destination, opts);
        return true;
    } catch (e) {
        // source doesn't exist, ok.
        return false;
    }
}
/**
 * Copies styles, fonts, images, illustrations, audio, and timings from supplied data folder to static.
 */
export function convertMedia(dataDir: string, verbose: number) {
    const requiredPaths = [
        'styles',
        'fonts'
    ];
    for(let p of requiredPaths) {
        copyDirectory(path.join(dataDir, p), path.join('static', p), verbose, false);
    }

    const optionalPaths = [
        'images',
        'illustrations',
        'audio',
        'timings',
        'backgrounds',
        'borders',
        'images',
        'clips',
        'videos',
        'icons'
    ];
    for (const p of optionalPaths) {
        copyDirectory(path.join(dataDir, p), path.join('static', p), verbose, true);
    }
}

function copyDirectory(from: string, to: string, verbose: number, optional: boolean) {
    if(optional) {
        if(cpSyncOptional(from, to, { recursive: true })) {
            if (verbose) console.log(`copied ${from} to ${to}`);
        } else if (verbose) console.log(`no files found in ${from}`);
    } else {
        cpSync(from, to, { recursive: true });
        if (verbose) console.log(`copied ${from} to ${to}`);
    }
}

export interface MediaTaskOutput extends TaskOutput {
    taskName: 'ConvertMedia';
}
/**
 * Copies styles, fonts, images, illustrations, audio, and timings from supplied data folder to static.
 */
export class ConvertMedia extends Task {
    public triggerFiles: string[] = [
        'images',
        'fonts',
        'styles',
        'illustrations',
        'audio',
        'timings',
        'backgrounds',
        'borders',
        'images',
        'clips',
        'videos',
        'icons'
    ];

    constructor(dataDir: string) {
        super(dataDir);
    }

    public async run(verbose: number, outputs: Map<string, TaskOutput>): Promise<TaskOutput> {
        convertMedia(this.dataDir, verbose);
        return {
            taskName: this.constructor.name,
            files: []
        };
    }
}
