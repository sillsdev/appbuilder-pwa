import { createHash } from 'crypto';
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';
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
                        const hash = createHash('md5');
                        hash.update(readFileSync(iconPath));
                        const digest = hash.digest('base64url');

                        const ext = path.extname(bareFileName);
                        const fname = path.basename(bareFileName, ext);

                        const hashedPath = bareFileName.replace(
                            `${fname}${ext}`,
                            `${fname}.${digest}${ext}`
                        );

                        finalName = hashedPath;

                        const dest = path.join('static', hashedPath);

                        if (!existsSync(dest)) {
                            copyFileSync(iconPath, dest);
                            if (verbose) console.log(`converted ${iconPath} to ${dest}`);
                        }
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

    const hash = createHash('md5');
    hash.update(contents);
    const digest = hash.digest('base64url');

    const name = `manifest.${digest}.json`;

    const dstFile = path.join('static', name);

    writeFileSync(dstFile, contents);
    if (verbose && existing) console.log(`converted ${srcFile} to ${dstFile}`);

    mkdirSync(path.join('src', 'generatedAssets'), { recursive: true });
    writeFileSync(
        path.join('src/generatedAssets', 'manifestUrl.json'),
        JSON.stringify({ url: name })
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
