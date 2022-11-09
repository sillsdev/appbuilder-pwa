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
    if (
        cpSyncOptional(path.join(dataDir, 'images'), path.join('static', 'images'), {
            recursive: true
        })
    ) {
        if (verbose)
            console.log(
                `copied ${path.join(dataDir, 'images')} to ${path.join('static', 'images')}`
            );
    } else if (verbose) console.log(`no images found in ${dataDir}`);

    // Copy the illustrations
    if (
        cpSyncOptional(path.join(dataDir, 'illustrations'), path.join('static', 'illustrations'), {
            recursive: true
        })
    ) {
        if (verbose)
            console.log(
                `copied ${path.join(dataDir, 'illustrations')} to ${path.join(
                    'static',
                    'illustrations'
                )}`
            );
    } else if (verbose) console.log(`no illustrations found in ${dataDir}`);

    // Copy local audio files
    if (
        cpSyncOptional(path.join(dataDir, 'audio'), path.join('static', 'audio'), {
            recursive: true
        })
    ) {
        if (verbose)
            console.log(`copied ${path.join(dataDir, 'audio')} to ${path.join('static', 'audio')}`);
    } else if (verbose) console.log(`no audio found in ${dataDir}`);

    // Copy timing files
    if (
        cpSyncOptional(path.join(dataDir, 'timings'), path.join('static', 'timings'), {
            recursive: true
        })
    ) {
        if (verbose)
            console.log(
                `copied ${path.join(dataDir, 'timings')} to ${path.join('static', 'timings')}`
            );
    } else if (verbose) console.log(`no timings found in ${dataDir}`);

    // Copy backgrounds files
    if (
        cpSyncOptional(path.join(dataDir, 'backgrounds'), path.join('static', 'backgrounds'), {
            recursive: true
        })
    ) {
        if (verbose)
            console.log(
                `copied ${path.join(dataDir, 'backgrounds')} to ${path.join(
                    'static',
                    'backgrounds'
                )}`
            );
    } else if (verbose) console.log(`no backgrounds found in ${dataDir}`);

    // Copy borders files
    if (
        cpSyncOptional(path.join(dataDir, 'borders'), path.join('static', 'borders'), {
            recursive: true
        })
    ) {
        if (verbose)
            console.log(
                `copied ${path.join(dataDir, 'borders')} to ${path.join('static', 'borders')}`
            );
    } else if (verbose) console.log(`no borders found in ${dataDir}`);

    // Copy images files
    if (
        cpSyncOptional(path.join(dataDir, 'images'), path.join('static', 'images'), {
            recursive: true
        })
    ) {
        if (verbose)
            console.log(
                `copied ${path.join(dataDir, 'images')} to ${path.join('static', 'images')}`
            );
    } else if (verbose) console.log(`no images found in ${dataDir}`);

    // Copy clips files
    if (
        cpSyncOptional(path.join(dataDir, 'clips'), path.join('static', 'clips'), {
            recursive: true
        })
    ) {
        if (verbose)
            console.log(`copied ${path.join(dataDir, 'clips')} to ${path.join('static', 'clips')}`);
    } else if (verbose) console.log(`no clips found in ${dataDir}`);

    // Copy videos files
    if (
        cpSyncOptional(path.join(dataDir, 'videos'), path.join('static', 'videos'), {
            recursive: true
        })
    ) {
        if (verbose)
            console.log(
                `copied ${path.join(dataDir, 'videos')} to ${path.join('static', 'videos')}`
            );
    } else if (verbose) console.log(`no videos found in ${dataDir}`);

    // Copy icons files
    if (
        cpSyncOptional(path.join(dataDir, 'icons'), path.join('static', 'icons'), {
            recursive: true
        })
    ) {
        if (verbose)
            console.log(`copied ${path.join(dataDir, 'icons')} to ${path.join('static', 'icons')}`);
    } else if (verbose) console.log(`no icons found in ${dataDir}`);
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
