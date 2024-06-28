import { ConfigTaskOutput } from './convertConfig';
import { ContentsTaskOutput } from './convertContents';
import { CopySyncOptions, cpSync, existsSync } from 'fs';
import { rimraf } from 'rimraf';
import path from 'path';
import { Task, TaskOutput } from './Task';
import { compareVersions } from './stringUtils';

function cpSyncOptional(source: string, destination: string, opts?: CopySyncOptions): boolean {
    try {
        cpSync(source, destination, opts);
        return true;
    } catch (e) {
        // source doesn't exist, ok.
        return false;
    }
}
/**
 * Copies a directory from supplied data folder to a target
 */
function cloneDirectory(from: string, to: string, verbose: number, optional = false) {
    if (optional) {
        if (cpSyncOptional(from, to, { recursive: true })) {
            if (verbose) console.log(`copied ${from} to ${to}`);
        } else if (verbose) console.log(`no files found in ${from}`);
    } else {
        cpSync(from, to, { recursive: true });
        if (verbose) console.log(`copied ${from} to ${to}`);
    }
}

/**
 * Copies extra media assets from supplied data folder to static/assets
 */
function cloneToAssets(from: string[], verbose: number) {
    from.forEach((f) => {
        if (
            cpSyncOptional(path.join('data', f), path.join('static', 'assets', f), {
                recursive: true
            })
        ) {
            if (verbose)
                console.log(
                    `copied ${path.join('data', f)} to ${path.join('static', 'assets', f)}`
                );
        } else if (verbose) console.log(`${path.join('data', f)} does not exist`);
    });
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
        'illustrations',
        'audio',
        'timings',
        'backgrounds',
        'borders',
        'watermarks',
        'clips',
        'videos',
        'icons'
    ];

    constructor(dataDir: string) {
        super(dataDir);
    }

    public async run(
        verbose: number,
        outputs: Map<string, TaskOutput>,
        modifiedPaths: string[]
    ): Promise<TaskOutput> {
        const config = outputs.get('ConvertConfig') as ConfigTaskOutput;
        const contents = outputs.get('ConvertContents') as ContentsTaskOutput;
        const modifiedDirectories = new Set<string>();
        for (const p of modifiedPaths) {
            // During the first run, paths are just the folders in the trigger files.
            // During an update due to watch (especially switching projects), the paths
            // include all the file names (appdef.xml, etc)
            const parts = p.split(path.sep);
            const subdir = parts[0];
            if (this.triggerFiles.includes(subdir)) {
                modifiedDirectories.add(subdir);
            }
        }
        await this.convertMedia(this.dataDir, config, contents, verbose, [...modifiedDirectories]);
        return {
            taskName: this.constructor.name,
            files: []
        };
    }
    async convertMedia(
        dataDir: string,
        configData: ConfigTaskOutput,
        contentsData: ContentsTaskOutput,
        verbose: number,
        modifiedDirectories: string[]
    ) {
        const required = ['fonts'];

        // FIXME: about 1/5 times the copy fails because of EPERM
        // I suspect this is because of my filesystem. If you also encounter this
        // error there will need to be a delay between the removal and the copy.
        await Promise.all(
            modifiedDirectories.map((p) =>
                rimraf(path.join('static', p)).then(() => {
                    if (verbose) console.log(`removed ${path.join('static', p)}`);
                    return p;
                })
            )
        );

        for (const p of modifiedDirectories) {
            cloneDirectory(
                path.join(dataDir, p),
                path.join('static', p),
                verbose,
                !required.includes(p)
            );
        }

        // TEMP: copy audio files from quizzes and contents from root folder to
        // assets folder
        if (compareVersions(configData.data.programVersion!, '12.0') < 0) {
            const items = contentsData.data.items;
            if (items) {
                const audioFiles = [];
                for (const item of items) {
                    if (item.audioFilename && Object.values(item.audioFilename).length > 0) {
                        for (const audioFilename of Object.values(item.audioFilename)) {
                            if (existsSync(path.join('data', audioFilename))) {
                                audioFiles.push(audioFilename);
                            }
                        }
                    }
                }
                if (audioFiles.length > 0) {
                    cloneToAssets(audioFiles, verbose);
                }
            }
            cloneToAssets(['quiz-right-answer.mp3', 'quiz-wrong-answer.mp3'], verbose);
        }
    }
}
