import { CopyOptions, cpSync } from 'fs';
import path from 'path';
import { Task, TaskOutput } from './Task';

function cpSyncOptional(source: string, destination: string, opts?: CopyOptions): void {
    try {
        cpSync(source, destination, opts);
    } catch (e) {
        // source doesn't exist, ok.
    }
}

export function convertMedia(dataDir: string) {
    // Copy the css stylesheets
    cpSync(path.join(dataDir, 'styles'), path.join('static', 'styles'), { recursive: true });

    // Copy the font files
    cpSync(path.join(dataDir, 'fonts'), path.join('static', 'fonts'), { recursive: true });

    // Copy the images
    cpSyncOptional(path.join(dataDir, 'images'), path.join('static', 'images'), {
        recursive: true
    });

    // Copy the illustrations
    cpSyncOptional(path.join(dataDir, 'illustrations'), path.join('static', 'illustrations'), {
        recursive: true
    });
}

export interface MediaTaskOutput extends TaskOutput {
    taskName: 'ConvertMedia';
}

export class ConvertMedia extends Task {
    public triggerFiles: string[] = ['images', 'fonts', 'styles', 'illustrations'];

    constructor(dataDir: string) {
        super(dataDir);
    }

    public async run(outputs: Map<string, TaskOutput>): Promise<TaskOutput> {
        convertMedia(this.dataDir);
        return {
            taskName: this.constructor.name,
            files: []
        };
    }
}
