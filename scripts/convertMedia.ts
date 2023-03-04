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
    // Copy the css stylesheets
    cpSync(path.join(dataDir, 'styles'), path.join('static', 'styles'), { recursive: true });
    if (verbose)
        console.log(`copied ${path.join(dataDir, 'styles')} to ${path.join('static', 'styles')}`);

    // Copy the font files
    cpSync(path.join(dataDir, 'fonts'), path.join('static', 'fonts'), { recursive: true });
    if (verbose)
        console.log(`copied ${path.join(dataDir, 'fonts')} to ${path.join('static', 'fonts')}`);

    const paths = [
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
    for (const p of paths) {
        doCopyForRoute(path.join(dataDir, p), path.join('static', p), verbose);
    }
}

function doCopyForRoute(from: string, to: string, verbose: number) {
    if(cpSyncOptional(from, to, { recursive: true })) {
        if (verbose) console.log(`copied ${from} to ${to}`);
    } else if (verbose) console.log(`no files found in ${from}`);
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
