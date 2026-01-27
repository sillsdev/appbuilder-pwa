import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { createHashedFile, createHashedFileFromContents, joinUrlPath } from './fileUtils';
import { Task, TaskOutput } from './Task';

export interface ManifestTaskOutput extends TaskOutput {
    taskName: 'ConvertManifest';
}

function normalizePath(p: string): string {
    if (p.endsWith('/')) {
        return p;
    } else {
        return p + '/';
    }
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
        const lines = fileContents.split(/\r?\n/);
        const eol = fileContents.includes('\r\n') ? '\r\n' : '\n';
        contents = lines
            .map((line) => {
                const pwaPath = process.env.BUILD_BASE_PATH
                    ? normalizePath(process.env.BUILD_BASE_PATH)
                    : '/';
                if (line.includes('start_url')) {
                    line = `  "start_url" : "${pwaPath}",`;
                }
                if (line.includes('scope')) {
                    line = `  "scope" : "${pwaPath}",`;
                }
                if (line.includes('"src":') && line.includes('./icons')) {
                    const srcMatch = line.match(/"src"\s*:\s*"\.\/([^"]+)"/);
                    if (!srcMatch) {
                        console.error(`Could not parse icon path from line: ${line}`);
                        return line;
                    }
                    const bareFileName = srcMatch[1];

                    let finalName = bareFileName;

                    const iconPath = path.join(dataDir, bareFileName);

                    if (existsSync(iconPath)) {
                        finalName = createHashedFile(dataDir, bareFileName, verbose);
                    } else {
                        throw new Error(`Required icon file ${iconPath} does not exist!`);
                    }

                    line = line.replace(srcMatch[0], `"src": "${joinUrlPath('.', finalName)}"`);
                }
                return line;
            })
            .join(eol);
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

    mkdirSync(path.join('src', 'gen-assets'), { recursive: true });
    writeFileSync(
        path.join('src/gen-assets', 'manifestUrl.json'),
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
