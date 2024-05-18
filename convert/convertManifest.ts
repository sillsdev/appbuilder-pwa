import { existsSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { TaskOutput, Task } from './Task';

export interface ManifestTaskOutput extends TaskOutput {
    taskName: 'ConvertManifest';
}
/**
 * Copies manifest.webmanifest to static folder
 */
export function convertManifest(dataDir: string, verbose: number) {
    const srcFile = path.join(dataDir, 'manifest.json');
    const dstFile = path.join('static', 'manifest.json');
    if (existsSync(srcFile)) {
        const fileContents = readFileSync(srcFile).toString();
        const lines = fileContents.split('\n');
        const updatedFileContents = lines
            .map((line) => {
                if (line.includes('start_url')) {
                    const path = process.env.BUILD_BASE_PATH ? process.env.BUILD_BASE_PATH : '.';
                    line = `  "start_url" : "${path}/",`;
                }
                if (line.includes('scope')) {
                    const path = process.env.BUILD_BASE_PATH ? process.env.BUILD_BASE_PATH : '/';
                    line = `  "scope" : "${path}",`;
                }
                return line;
            })
            .join('\n');
        writeFileSync(dstFile, updatedFileContents);
        if (verbose) console.log(`converted ${srcFile} to ${dstFile}`);
    } else {
        // If no manifest exists, we need to at least have a minimum manifest to build.
        const manifest = {
            name: 'Temp PWA',
            start_url: './',
            display: 'standalone',
            background_color: '#000000',
            theme_color: '#000000'
        };
        writeFileSync(dstFile, JSON.stringify(manifest));
    }
}
export class ConvertManifest extends Task {
    public triggerFiles: string[] = ['manifest.json'];

    constructor(dataDir: string) {
        super(dataDir);
    }
    public async run(verbose: number, outputs: Map<string, TaskOutput>): Promise<TaskOutput> {
        convertManifest(this.dataDir, verbose);
        return {
            taskName: this.constructor.name,
            files: []
        };
    }
}
