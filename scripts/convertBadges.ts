import { Promisable, Task, TaskOutput } from './Task';
import path from 'path';
import { ConfigTaskOutput } from './convertConfig';
import { copyFile, existsSync } from 'fs';

export async function convertBadges(
    badgesDir: string,
    configData: ConfigTaskOutput,
    verbose: number
) {
    /**badge languages from config*/
    const languages = Object.keys(configData.data.interfaceLanguages!.writingSystems);
    for (const language of languages) {
        const srcFile = path.join(badgesDir, language + '_app_store.svg');
        const dstFile = path.join('static', 'badges', language + '_app_store.svg');
        if (existsSync(srcFile)) {
            copyFile(srcFile, dstFile, function (err: any) {
                if (err) throw err;
                if (verbose) console.log(`copied ${srcFile} to ${dstFile}`);
            });
        }
    }
}
export interface BadgesTaskOutput extends TaskOutput {
    taskName: 'ConvertBadges';
}

export class ConvertBadges extends Task {
    public triggerFiles: string[] = [];
    public badgesDir: string;
    constructor(dataDir: string) {
        super(dataDir);
        this.badgesDir = path.join(__dirname, 'badges');
    }
    public run(
        verbose: number,
        outputs: Map<string, TaskOutput>,
        modifiedPaths: string[]
    ): Promisable<BadgesTaskOutput> {
        const config = outputs.get('ConvertConfig') as ConfigTaskOutput;

        convertBadges(this.badgesDir, config, verbose);
        return {
            taskName: 'ConvertBadges',
            files: []
        };
    }
}
