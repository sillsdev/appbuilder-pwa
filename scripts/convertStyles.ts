import { existsSync, readFileSync, writeFileSync, readdirSync, mkdirSync } from 'fs';
import path from 'path';
import { TaskOutput, Task } from './Task';

export interface StylesTaskOutput extends TaskOutput {
    taskName: 'ConvertStyles';
}
/**
 * Convert firebase-config.js to module or provide null definition
 */
export function convertStyles(dataDir: string, verbose: number) {
    const srcDir = path.join(dataDir, 'styles');
    const dstDir = path.join('static', 'styles');
    mkdirSync(dstDir, { recursive: true });

    readdirSync(srcDir).forEach((file) => {
        const srcFile = path.join(srcDir, file);
        const dstFile = path.join(dstDir, file);

        const fileContents = readFileSync(srcFile).toString();
        const lines = fileContents.split('\n');
        const updatedFileContents = lines
            .map((line) => {
                if (line.indexOf('body') === 0) {
                    line = line
                        .replace('body', '#content')
                        .replace('margin-top', 'padding-top')
                        .replace('margin-bottom', 'padding-bottom');
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
