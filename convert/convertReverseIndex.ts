import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'fs';
import path from 'path';
import { Task, TaskOutput } from './Task';
import type { DictionaryConfig, WritingSystemConfig } from '$config';

interface ReversalEntry {
    index: number;
    name: string;
    homonym_index?: number;
}

function convertReverseIndex(
    dataDir: string,
    language: string,
    alphabet: string[]
): void {
    const indexFilePath = path.join(dataDir, `lexicon-${language}.idx`);
    const outputDir = path.join('static', 'reversal', 'language', language);

    if (!existsSync(indexFilePath)) {
        console.warn(`No reversal index found for language: ${language}`);
        return;
    }

    const content = readFileSync(indexFilePath, 'utf-8');
    const indexEntries = content.split('\n').map((line) => line.trim().split('\t'));

    if (!existsSync(outputDir)) {
        mkdirSync(outputDir, { recursive: true });
    }

    // Process each letter of the alphabet
    alphabet.forEach((letter) => {
        const LETTER = letter.trim()[0].toUpperCase();
        const reversalMap: { [key: string]: ReversalEntry[] } = {};

        // Process entries for this letter
        indexEntries.forEach(([gloss, ids]) => {
            if (gloss && ids && gloss.trim()[0].toUpperCase() === LETTER) {
                // Split IDs and handle homonym indexes
                const idList = ids.split(',').map(id => {
                    const trimmed = id.trim();
                    const match = trimmed.match(/^(\d+)(?:\^(\d+))?$/);
                    if (match) {
                        const entry: ReversalEntry = {
                            index: parseInt(match[1]),
                            name: gloss
                        };
                        if (match[2]) {
                            entry.homonym_index = parseInt(match[2]);
                        }
                        return entry;
                    }
                    return null;
                }).filter((entry): entry is ReversalEntry => entry !== null);

                if (idList.length > 0) {
                    reversalMap[gloss] = idList;
                }
            }
        });

        if (Object.keys(reversalMap).length > 0) {
            const outputFilePath = path.join(outputDir, `${LETTER.toLowerCase()}.json`);
            writeFileSync(outputFilePath, JSON.stringify(reversalMap, null, 4), 'utf-8');
        }
    });
}

export class ConvertReverseIndex extends Task {
    public triggerFiles: string[] = ['lexicon-*.idx'];

    constructor(dataDir: string) {
        super(dataDir);
    }

    public async run(verbose: number, outputs: Map<string, TaskOutput>): Promise<TaskOutput> {
        const configOutput = outputs.get('ConvertConfig') as { data: DictionaryConfig } | undefined;
        if (!configOutput || !configOutput.data) {
            throw new Error('Config data not found in outputs');
        }

        if (!configOutput.data.writingSystems) {
            throw new Error('No writing systems found in config data');
        }

        // Get all lexicon index files in the data directory
        const files = this.triggerFiles
            .map(pattern => pattern.replace('*', '(.+)'))
            .map(pattern => new RegExp(pattern));

        const indexFiles = readdirSync(this.dataDir)
            .filter(file => files.some(pattern => pattern.test(file)))
            .map(file => {
                const match = file.match(/lexicon-(.+)\.idx$/);
                return match ? match[1] : null;
            })
            .filter((lang): lang is string => lang !== null);

        // Process each index file
        for (const languageCode of indexFiles) {
            const writingSystem = configOutput.data.writingSystems[languageCode];
            if (writingSystem?.alphabet) {
                convertReverseIndex(this.dataDir, languageCode, writingSystem.alphabet);
            } else {
                console.warn(`No alphabet configuration found for language ${languageCode}`);
            }
        }

        return {
            taskName: this.constructor.name,
            files: []
        };
    }
}