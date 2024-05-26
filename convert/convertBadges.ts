import { Promisable, Task, TaskOutput } from './Task';
import path from 'path';
import { ConfigTaskOutput } from './convertConfig';
import { copyFile, existsSync, mkdirSync, rmSync, writeFileSync } from 'fs';

export async function convertBadges(
    badgesDir: string,
    configData: ConfigTaskOutput,
    verbose: number
) {
    const dstBadgeDir = path.join('static', 'badges');
    if (!configData.data.mainFeatures['share-apple-app-link']) {
        if (existsSync(dstBadgeDir)) {
            rmSync(dstBadgeDir, { recursive: true });
        }
        return;
    }

    if (!existsSync(dstBadgeDir)) {
        mkdirSync(dstBadgeDir);
    }

    // Badge languages from config
    const languages = Object.keys(configData.data.interfaceLanguages!.writingSystems);
    // Make sure there is english for fallback
    if (languages.length > 1 && !languages.includes('en')) {
        languages.push('en');
    }
    const foundLanguages = [];
    for (const language of languages) {
        const srcFile = path.join(badgesDir, language + '_app_store.svg');
        const dstFile = path.join(dstBadgeDir, language + '_app_store.svg');
        if (existsSync(srcFile)) {
            foundLanguages.push(language);
            copyFile(srcFile, dstFile, function (err: any) {
                if (err) throw err;
                if (verbose) console.log(`copied ${srcFile} to ${dstFile}`);
            });
        }
    }

    //write index file
    writeFileSync(
        path.join(dstBadgeDir, 'languages.json'),
        `[${(() => {
            //export badge languages as array
            let s = '';
            let i = 0;
            for (const language of foundLanguages) {
                s += '"' + language + '"' + (i + 1 < foundLanguages.length ? ', ' : '');
                i++;
            }
            return s;
        })()}]`
    );
}
export interface BadgesTaskOutput extends TaskOutput {
    taskName: 'ConvertBadges';
}

export class ConvertBadges extends Task {
    public triggerFiles: string[] = ['appdef.xml'];
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
