import * as fs from 'fs';
import path from 'path';
import { createHashedFile } from './fileUtils';
import { Task, TaskOutput } from './Task';

const base = process.env.BUILD_BASE_PATH || '';

export interface AboutTaskOutput extends TaskOutput {
    taskName: 'ConvertAbout';
}

// Function to check if an image is missing
function isImageMissing(imageSource: string, dataDir: string): boolean {
    return !fs.existsSync(path.join(dataDir, 'illustrations', imageSource));
}

function updateImgTags(text: string, dataDir: string, verbose: number): string {
    return text.replace(
        /<img\b[^>]*\bsrc=["']([^"']*\/)?([^"']*)["'][^>]*>/gi,
        (_match, _path, fileName) => {
            // If the image is missing in the "illustrations" folder, filter out the entire tag
            if (isImageMissing(fileName, dataDir)) {
                return '';
            } else {
                fs.mkdirSync(path.join('static', 'illustrations'), { recursive: true });
                const imagePath = createHashedFile(dataDir, `illustrations/${fileName}`, verbose);

                return `<img src="${base}/${imagePath}">`;
            }
        }
    );
}

/**
 * Copies about.partial.html to static folder with image tag processing
 */
export function convertAbout(dataDir: string, verbose: number) {
    const srcFile = path.join(dataDir, 'about.partial.html');
    const dstFile = path.join('src/gen-assets', 'about.partial.html');

    // Read the file content
    const content = fs.readFileSync(srcFile, 'utf8');

    // Apply the updateImgTags filter
    const processedContent = updateImgTags(content, dataDir, verbose);

    // Write the processed content to the destination
    fs.writeFileSync(dstFile, processedContent, 'utf8');

    if (verbose) console.log(`copied and processed ${srcFile} to ${dstFile}`);
}
export class ConvertAbout extends Task {
    public triggerFiles: string[] = ['about.partial.html'];

    constructor(dataDir: string) {
        super(dataDir);
    }
    public async run(verbose: number, outputs: Map<string, TaskOutput>): Promise<TaskOutput> {
        convertAbout(this.dataDir, verbose);
        return {
            taskName: this.constructor.name,
            files: []
        };
    }
}
