import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import path from 'path';
import { Task, TaskOutput } from './Task';
import type { DictionaryConfig } from '$config';

interface ReversalEntry {
    index: number;
    name: string;
    homonym_index?: number;
}

const ENTRIES_PER_CHUNK = 100;

function getBaseLetter(char: string, alphabet: string[]): string {
    const alphabetEntry = alphabet.find((entry) =>
        char.toLowerCase().startsWith(entry.toLowerCase())
    );
    if (!alphabetEntry) {
        return char.normalize('NFD')[0].toUpperCase();
    }
    return alphabetEntry[0].toUpperCase();
}

function convertReverseIndex(
    dataDir: string,
    language: string,
    alphabet: string[],
    reversalFilename: string
): void {
    const indexFilePath = path.join(dataDir, 'reversal', reversalFilename);
    const outputDir = path.join('static', 'reversal', 'language', language);

    if (!existsSync(indexFilePath)) {
        throw new Error(`Required reversal index not found: ${indexFilePath}`);
    }

    const content = readFileSync(indexFilePath, 'utf-8');
    const indexEntries = content
        .split('\n')
        .map((line) => line.trim().split('\t'))
        .filter(([gloss]) => gloss?.length > 0);

    const entriesByLetter: { [letter: string]: [string, string][] } = {};

    indexEntries.forEach((entry) => {
        if (!entry || !entry[0]) return;
        const gloss = entry[0];

        const firstLetter = getBaseLetter(gloss, alphabet);
        if (!entriesByLetter[firstLetter]) {
            entriesByLetter[firstLetter] = [];
        }
        entriesByLetter[firstLetter].push([entry[0], entry[1]]);
    });

    if (!existsSync(outputDir)) {
        mkdirSync(outputDir, { recursive: true });
    }

    Object.entries(entriesByLetter).forEach(([letter, entries]) => {
        entries.sort(([a], [b]) => a.localeCompare(b, language));

        let currentChunk: { [key: string]: ReversalEntry[] } = {};
        let currentCount = 0;
        let chunkIndex = 0;

        for (let i = 0; i < entries.length; i++) {
            const [gloss, ids] = entries[i];
            if (!gloss || !ids) continue;

            const idList = ids
                .split(',')
                .map((id) => {
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
                })
                .filter((entry): entry is ReversalEntry => entry !== null);

            if (idList.length > 0) {
                currentChunk[gloss] = idList;
                currentCount++;

                if (currentCount >= ENTRIES_PER_CHUNK || i === entries.length - 1) {
                    const chunkFileName = `${letter.toLowerCase()}-${String(chunkIndex + 1).padStart(3, '0')}.json`;
                    const chunkPath = path.join(outputDir, chunkFileName);

                    writeFileSync(chunkPath, JSON.stringify(currentChunk, null, 4), 'utf-8');

                    currentChunk = {};
                    currentCount = 0;
                    chunkIndex++;
                }
            }
        }
    });
}

export class ConvertReverseIndex extends Task {
    public triggerFiles: string[] = ['reversal'];

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

        for (const lang in configOutput.data.writingSystems) {
            const writingSystem = configOutput.data.writingSystems[lang];

            if (writingSystem.reversalFilename && writingSystem.alphabet) {
                if (verbose) {
                    console.log(`Processing reversal index for language: ${lang}`);
                }

                convertReverseIndex(
                    this.dataDir,
                    lang,
                    writingSystem.alphabet,
                    writingSystem.reversalFilename
                );
            }
        }

        return {
            taskName: this.constructor.name,
            files: []
        };
    }
}