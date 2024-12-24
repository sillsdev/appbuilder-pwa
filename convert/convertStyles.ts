import { existsSync, readFileSync, writeFileSync, readdirSync, mkdirSync } from 'fs';
import path from 'path';
import { TaskOutput, Task } from './Task';
import { compareVersions } from './stringUtils';
import { ConfigTaskOutput } from 'convertConfig';
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
export function convertStyles(
    dataDir: string,
    staticDir: string,
    configData: ConfigTaskOutput,
    verbose: number
) {
    const srcDir = path.join(dataDir, 'styles');
    const dstDir = path.join(staticDir, 'styles');
    mkdirSync(dstDir, { recursive: true });

    readdirSync(srcDir).forEach((file) => {
        const srcFile = path.join(srcDir, file);
        const dstFile = path.join(dstDir, file);
        if (verbose) console.log('Converting: ', srcFile);

        let swapped = false;

        const fileContents = readFileSync(srcFile).toString();
        const lines = fileContents.split('\n');
        // Until App Builders 12.0 is released, then add these styles
        const tempStyles = srcFile.endsWith('-app.css') ? getTempStyles(configData, verbose) : '';
        const updatedFileContents =
            tempStyles +
            lines
                .map((line) => {
                    if (line.indexOf('body {') === 0 && srcFile.includes('-app.css')) {
                        const m = line.match(/direction: (LTR|RTL);/);
                        if (m) {
                            // See CommonReaderAppBuilderCore::doBeforeSavingNewApp
                            // if the first book collection was RTL, then it swapped all the styles
                            // We want to use the styles that do the right thing when direction
                            // changes.
                            swapped = m[1] === 'RTL';
                        }
                    }
                    if (swapped) {
                        line = line.replace('padding-right', 'padding-inline-start');
                        line = line.replace('padding-left', 'padding-inline-end');
                        line = line.replace('margin-right', 'margin-inline-start');
                        line = line.replace('margin-left', 'margin-inline-end');
                        line = line.replace('float: right', 'float: inline-start');
                        line = line.replace('float: left', 'float: inline-end');
                        line = line.replace('text-align: right', 'text-align: start');
                        line = line.replace('text-align: left', 'text-align: end');
                    } else {
                        line = line.replace('padding-left', 'padding-inline-start');
                        line = line.replace('padding-right', 'padding-inline-end');
                        line = line.replace('margin-left', 'margin-inline-start');
                        line = line.replace('margin-right', 'margin-inline-end');
                        line = line.replace('float: left', 'float: inline-start');
                        line = line.replace('float: right', 'float: inline-end');
                        line = line.replace('text-align: left', 'text-align: start');
                        line = line.replace('text-align: right', 'text-align: end');
                    }
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
                    if (line.includes('/fonts/') && process.env.BUILD_BASE_PATH) {
                        line = line.replace('/fonts/', process.env.BUILD_BASE_PATH + '/fonts/');
                    }
                    return line;
                })
                .join('\n');
        writeFileSync(dstFile, updatedFileContents);
    });
}

function getTempStyles(configData: ConfigTaskOutput, verbose: number): string {
    const tempStyles: string[] = [];
    if (compareVersions(configData.data.programVersion!, '12.0') < 0) {
        if (verbose) console.log('Add contents styles');
        tempStyles.push('div.contents-item-locked { position:relative; }');
        tempStyles.push(
            "div.contents-item-locked::after { content: ''; position: absolute; top: 0; right: 0; width: 0; height: 0; border-left: 50px solid transparent; border-top: 50px solid yellow; background-size: cover; border-width: 70px; }"
        );

        tempStyles.push(
            'div.contents-item-locked-image { position:absolute; top:8px; right:8px; z-index:10; }'
        );
        tempStyles.push(
            'div.contents-item-audio-image { position:absolute; bottom:8px; right:8px; width:24px; height:24px; z-index:10; }'
        );
    }
    if (compareVersions(configData.data.programVersion!, '12.6') < 0) {
        if (verbose) console.log('Add plan styles');
        tempStyles.push(
            '.plan-days-scroller { overflow-x: scroll; white-space: nowrap; margin-top: 6px; margin-bottom: 6px; }'
        );
        tempStyles.push('.plan-days-scroller::-webkit-scrollbar { display: none; }');
        tempStyles.push('.plan-days-scroller { -ms-overflow-style: none; scrollbar-width: none; }');
        tempStyles.push(
            '.plan-day-box { display: inline-block; position:relative; width: 60px; height: 60px; border: 1px solid; border-bottom: 3px solid; text-align: center; cursor: pointer; }'
        );
        tempStyles.push(
            '.plan-day-box.selected { border-top: 3px solid; border-left: 3px solid; border-right: 3px solid; border-bottom: 3px; padding-bottom: 2px; }'
        );
        tempStyles.push(
            '.plan-day-box.blank { border-top: 1px; border-left: 1px; border-right: 1px; border-bottom: 3px solid; }'
        );
        tempStyles.push(
            '.plan-day-box-content { position:absolute; top:50%; left:50%; transform: translate(-50%, -50%); }'
        );
        tempStyles.push('.plan-checkbox-image { display:block; }');
    }
    return tempStyles.join('\n') + '\n';
}

export class ConvertStyles extends Task {
    public triggerFiles: string[] = ['styles'];

    public async run(verbose: number, outputs: Map<string, TaskOutput>) {
        const config = outputs.get('ConvertConfig') as ConfigTaskOutput;
        convertStyles(this.dataDir, this.outDirs.static, config, verbose);
        return {
            taskName: this.constructor.name,
            files: []
        };
    }
}
