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

    // Copy the images
    doCopyForRoute(path.join(dataDir, 'images'), path.join('static', 'images'), verbose);

    // Copy the illustrations
    doCopyForRoute(path.join(dataDir, 'illustrations'), path.join('static', 'illustrations'), verbose);

    // Copy local audio files
    doCopyForRoute(path.join(dataDir, 'audio'), path.join('static', 'audio'), verbose);

    // Copy timing files
    doCopyForRoute(path.join(dataDir, 'timings'), path.join('static', 'timings'), verbose);

    // Copy backgrounds files
    doCopyForRoute(path.join(dataDir, 'backgrounds'), path.join('static', 'backgrounds'), verbose);

    // Copy borders files
    doCopyForRoute(path.join(dataDir, 'borders'), path.join('static', 'borders'), verbose);

    // Copy images files
    doCopyForRoute(path.join(dataDir, 'images'), path.join('static', 'images'), verbose);

    // Copy clips files
    doCopyForRoute(path.join(dataDir, 'clips'), path.join('static', 'clips'), verbose);

    // Copy videos files
    doCopyForRoute(path.join(dataDir, 'videos'), path.join('static', 'videos'), verbose);

    // Copy icons files
    doCopyForRoute(path.join(dataDir, 'icons'), path.join('static', 'icons'), verbose);
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
