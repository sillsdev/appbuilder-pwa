import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { Task, TaskOutput } from './Task';
import type { ConfigData } from '$config';

function getEntries(dbPath: string): Map<number, { name: string, homonym_index: number }> {
    const entryMap = new Map<number, { name: string, homonym_index: number }>();
    try {
        const query = 'SELECT id, name, homonym_index FROM entries';
        const command = `sqlite3 "${dbPath}" "${query}"`;
        const result = execSync(command).toString();

        result.split('\n').forEach((line) => {
            const [idStr, name, homonymIndexStr] = line.split('|');
            if (idStr && name) {
                entryMap.set(parseInt(idStr.trim()), {
                    name: name.trim(),
                    homonym_index: homonymIndexStr ? parseInt(homonymIndexStr.trim()) : 0,
                });
            }
        });
    } catch (error) {
        console.error('Error executing sqlite3 command:', error);
    }
    return entryMap;
}

function extractAlphabet(indexEntries: string[][]): string[] {
    const firstChars = new Set<string>();
    indexEntries.forEach(([gloss]) => {
        if (gloss && gloss.trim()) {
            const firstChar = gloss.trim()[0].toUpperCase();
            if (firstChar) {
                firstChars.add(firstChar);
            }
        }
    });

    return Array.from(firstChars).sort();
}

function convertReverseIndexForAllLetters(
    dataDir: string,
    language: string,
    verbose: number
): void {
    const dbPath = path.join(dataDir, 'data.sqlite');
    const indexFilePath = path.join(dataDir, 'lexicon-en.idx');
    const outputDir = path.join('static', 'reversal', 'language', language);

    const entries = getEntries(dbPath);
    const content = readFileSync(indexFilePath, 'utf-8');
    const indexEntries = content.split('\n').map((line) => line.trim().split('\t'));
    const alphabet = extractAlphabet(indexEntries);

    const letterHasEntries = new Map<string, boolean>();
    alphabet.forEach(letter => letterHasEntries.set(letter, false));

    indexEntries.forEach(([gloss]) => {
        if (gloss) {
            const firstChar = gloss.trim()[0].toUpperCase();
            if (firstChar && letterHasEntries.has(firstChar)) {
                letterHasEntries.set(firstChar, true);
            }
        }
    });

    const hasAnyEntries = Array.from(letterHasEntries.values()).some(hasEntries => hasEntries);

    if (hasAnyEntries) {
        if (!existsSync(outputDir)) {
            mkdirSync(outputDir, { recursive: true });
        }

        alphabet.forEach((LETTER) => {
            if (letterHasEntries.get(LETTER)) {
                const reverseMap: { [key: string]: Array<{ index: number, name: string, homonym_index: number }> } = {};

                indexEntries.forEach(([gloss, ids]) => {
                    if (gloss && ids && gloss.trim()[0].toUpperCase() === LETTER) {
                        const idList = ids.split(',').map((id) => id.trim());
                        reverseMap[gloss] = idList.map((id) => {
                            const entry = entries.get(parseInt(id));
                            return {
                                index: parseInt(id),
                                name: entry ? entry.name : 'UNKNOWN',
                                homonym_index: entry ? entry.homonym_index : 0,
                            };
                        });
                    }
                });

                if (Object.keys(reverseMap).length > 0) {
                    const outputFilePath = path.join(outputDir, `${LETTER.toLowerCase()}.json`);
                    writeFileSync(outputFilePath, JSON.stringify(reverseMap, null, 4), 'utf-8');
                }
            }
        });
    }
}

export class ConvertReverseIndex extends Task {
    public triggerFiles: string[] = ['lexicon-en.idx', 'data.sqlite'];

    constructor(dataDir: string) {
        super(dataDir);
    }

    public async run(verbose: number, outputs: Map<string, TaskOutput>): Promise<TaskOutput> {
        const configOutput = outputs.get('ConvertConfig') as { data: ConfigData } | undefined;
        if (!configOutput || !configOutput.data) {
            throw new Error('Config data not found in outputs');
        }

        if (!configOutput.data.interfaceLanguages) {
            throw new Error('No interfaceLanguages found in config data');
        }

        const writingSystems = Object.entries(configOutput.data.interfaceLanguages?.writingSystems || {});

        let glossSystem = writingSystems.find(([_, ws]) => ws.textDirection === 'gloss');

        if (!glossSystem) {
            glossSystem = writingSystems.find(([code]) => code === 'en');
        }

        if (!glossSystem && writingSystems.length > 0) {
            glossSystem = writingSystems[0];
        }

        if (!glossSystem) {
            throw new Error('No suitable writing system found in config data');
        }

        const [language] = glossSystem;

        convertReverseIndexForAllLetters(this.dataDir, language, verbose);

        return {
            taskName: this.constructor.name,
            files: []
        };
    }
}