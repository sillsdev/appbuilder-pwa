import { existsSync, readFileSync, writeFileSync, readdirSync, mkdirSync } from 'fs';
import path from 'path';
import { TaskOutput, Task } from './Task';

export interface StylesTaskOutput extends TaskOutput {
    taskName: 'ConvertStyles';
}
/**
 * Convert styles to use #container and #content instead of body
 * Note: The styles generated are for the body element of the mobile browser window in the Android
 * app.  This browser window doesn't include the app bar or tool bars.  With the PWA, we need
 * to split up the styles assigned to body. Most of the styles will be attached to #container.
 * The margin-top and margin-bottom are changed to padding-top and padding-bottom and attached
 * to the #content element instead.
 */
export function convertStyles(dataDir: string, verbose: number) {
    const srcDir = path.join(dataDir, 'styles');
    const dstDir = path.join('static', 'styles');
    mkdirSync(dstDir, { recursive: true });

    readdirSync(srcDir).forEach((file) => {
        const srcFile = path.join(srcDir, file);
        const dstFile = path.join(dstDir, file);
        if (verbose) console.log('Converting: ', srcFile);

        const fileContents = readFileSync(srcFile).toString();
        const lines = fileContents.split('\n');
        const updatedFileContents = lines
            .map((line) => {
                if (line.indexOf('body {') === 0 && line.indexOf('margin-top') > 0) {
                    const parts = line.split('margin-top');
                    line = parts[0].replace('body', '#container') + '}\n';
                    line +=
                        '#content { padding-top' +
                        parts[1].replace('margin-bottom', 'padding-bottom');
                }
                if (line.indexOf('body') === 0) {
                    line = line.replace('body', '#container');
                }
                return line;
            })
            .join('\n');
        writeFileSync(dstFile, updatedFileContents);
    });
}

export class ConvertStyles extends Task {
    public triggerFiles: string[] = ['styles'];

    constructor(dataDir: string) {
        super(dataDir);
    }
    public async run(verbose: number) {
        convertStyles(this.dataDir, verbose);
        return {
            taskName: this.constructor.name,
            files: []
        };
    }
}
