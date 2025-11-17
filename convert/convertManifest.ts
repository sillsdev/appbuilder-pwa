import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { createHashedFile, createHashedFileFromContents } from './fileUtils';
import { Task, TaskOutput } from './Task';

export interface ManifestTaskOutput extends TaskOutput {
    taskName: 'ConvertManifest';
}
/**
 * Copies manifest.webmanifest to static folder
 */
export function convertManifest(dataDir: string, verbose: number) {
    const srcFile = path.join(dataDir, 'manifest.json');
    let contents = '';
    const existing = existsSync(srcFile);
    if (existing) {
        mkdirSync(path.join('static', 'icons'), { recursive: true });
        const fileContents = readFileSync(srcFile).toString();
        const lines = fileContents.split('\n');
        contents = lines
            .map((line) => {
                if (line.includes('start_url')) {
                    const path = process.env.BUILD_BASE_PATH ? process.env.BUILD_BASE_PATH : '.';
                    line = `  "start_url" : "${path}/",`;
                }
                if (line.includes('scope')) {
                    const path = process.env.BUILD_BASE_PATH ? process.env.BUILD_BASE_PATH : '/';
                    line = `  "scope" : "${path}",`;
                }
                if (line.includes('"src":') && line.includes('./icons')) {
                    const split = line.split('./');
                    const bareFileName = split[1].replace(/",$/, '');

                    let finalName = bareFileName;

                    const iconPath = path.join(dataDir, bareFileName);

                    if (existsSync(iconPath)) {
                        finalName = createHashedFile(dataDir, bareFileName, verbose);
                    } else {
                        console.error(`File ${iconPath} does not exist!`);
                    }

                    line = split[0] + './' + finalName + '",';
                }
                return line;
            })
            .join('\n');
    } else {
        // If no manifest exists, we need to at least have a minimum manifest to build.
        const manifest = {
            name: 'Temp PWA',
            start_url: './',
            display: 'standalone',
            background_color: '#000000',
            theme_color: '#000000'
        };
        contents = JSON.stringify(manifest);
    }

    const hashedName = createHashedFileFromContents(contents, 'manifest.json', verbose);

    mkdirSync(path.join('src', 'generatedAssets'), { recursive: true });
    writeFileSync(
        path.join('src/generatedAssets', 'manifestUrl.json'),
        JSON.stringify({ url: hashedName })
    );
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
