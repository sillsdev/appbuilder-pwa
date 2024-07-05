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
        // Until App Builders 12.0 is released, then add these styles
        const tempStyles = srcFile.endsWith('-app.css') ? getContentsStyles() : '';
        const updatedFileContents =
            tempStyles +
            lines
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
                    if (line.indexOf('div.c-drop') === 0) {
                        line = line.replace('padding-right', 'padding-inline-end');
                        line = line.replace('float: left', 'display: inline-block');
                    }
                    if (line.includes('/fonts/') && process.env.BUILD_BASE_PATH) {
                        line = line.replace('/fonts/', process.env.BUILD_BASE_PATH + '/fonts/');
                    }
                    return line;
                })
                .join('\n');
        writeFileSync(dstFile, updatedFileContents);
    });
}

function getContentsStyles(): string {
    const contentsStyles: string[] = [];
    contentsStyles.push('div.contents-item-locked { position:relative; }');
    contentsStyles.push(
        "div.contents-item-locked::after { content: ''; position: absolute; top: 0; right: 0; width: 0; height: 0; border-left: 50px solid transparent; border-top: 50px solid yellow; background-size: cover; border-width: 70px; }"
    );

    contentsStyles.push(
        'div.contents-item-locked-image { position:absolute; top:8px; right:8px; z-index:10; }'
    );
    contentsStyles.push(
        'div.contents-item-audio-image { position:absolute; bottom:8px; right:8px; width:24px; height:24px; z-index:10; }'
    );

    return contentsStyles.join('\n') + '\n';
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
