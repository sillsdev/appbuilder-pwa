import { CopyOptions, cpSync } from 'fs';
import rmDir from 'rimraf';
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

    public async run(
        verbose: number,
        outputs: Map<string, TaskOutput>,
        modifiedPaths: string[]
    ): Promise<TaskOutput> {
        const modifiedDirectories = new Set<string>();
        for (const p of modifiedPaths) {
            modifiedDirectories.add(p.split(path.sep)[0]);
        }
        await this.convertMedia(this.dataDir, verbose, [...modifiedDirectories]);
        return {
            taskName: this.constructor.name,
            files: []
        };
    }
    async convertMedia(dataDir: string, verbose: number, modifiedDirectories: string[]) {
        const required = ['styles', 'fonts'];

        // FIXME: about 1/5 times the copy fails because of EPERM
        // I suspect this is because of my filesystem. If you also encounter this
        // error there will need to be a delay between the removal and the copy.
        await Promise.all(
            modifiedDirectories.map((p) =>
                rmDir(path.join('static', p)).then(() => {
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
    }
}
