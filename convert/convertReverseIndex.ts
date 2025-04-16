import { existsSync, mkdirSync, readFileSync } from 'fs';
import path from 'path';
import type { DictionaryConfig } from '$config';
import { FileContent, Task, TaskOutput } from './Task';

interface ReversalEntry {
    index: number;
    name: string;
    homonym_index?: number;
}

const ENTRIES_PER_CHUNK = 100;

function makeEntryLetter(char: string) {
    return char.toUpperCase();
}

function getBaseLetter(char: string, alphabet: string[]): string | null {
    const alphabetEntry = alphabet.find((entry) =>
        char.normalize('NFD')[0].toLowerCase().startsWith(entry.toLowerCase())
    );
    if (!alphabetEntry) {
        return null;
    }
    return makeEntryLetter(alphabetEntry[0]);
}

export function convertReverseIndex(
    dataDir: string,
    language: string,
    alphabet: string[]
): FileContent[] {
    const indexFilePath = path.join(dataDir, 'reversal', `lexicon-${language}.idx`);
    const outputDir = path.join('static', 'reversal', language);
    const files: FileContent[] = [];

    if (!existsSync(indexFilePath)) {
        throw new Error(`Required reversal index not found: ${indexFilePath}`);
    }

    if (!existsSync(outputDir)) {
        mkdirSync(outputDir, { recursive: true });
    }

    const content = readFileSync(indexFilePath, 'utf-8');
    const indexEntries = content
        .split('\n')
        .map((line) => line.trim().split('\t'))
        .filter(([gloss]) => gloss?.length > 0);

    const entriesByLetter: { [letter: string]: [string, string][] } = {};
    const fileIndexByLetter: { [letter: string]: string[] } = {}; // New index for files by letter

    let latestLetter = makeEntryLetter(alphabet[0]);
    indexEntries.forEach((entry) => {
        if (!entry || !entry[0]) return;
        const gloss = entry[0];

        const firstLetter = getBaseLetter(gloss, alphabet);
        const entryLetter = firstLetter ?? latestLetter;
        const fileEntryLetter = entryLetter.toLowerCase();
        if (!entriesByLetter[entryLetter]) {
            entriesByLetter[entryLetter] = [];
            fileIndexByLetter[fileEntryLetter] = []; // Initialize file index for the letter
        }
        entriesByLetter[entryLetter].push([entry[0], entry[1]]);
        latestLetter = entryLetter;
    });

    Object.entries(entriesByLetter).forEach(([letter, entries]) => {
        const fileLetter = letter.toLowerCase();
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
                    const chunkFileName = `${fileLetter}-${String(chunkIndex + 1).padStart(3, '0')}.json`;
                    const chunkPath = path.join(outputDir, chunkFileName);

                    files.push({
                        path: chunkPath,
                        content: JSON.stringify(currentChunk, null, 2)
                    });

                    fileIndexByLetter[fileLetter].push(chunkFileName); // Add file to index

                    currentChunk = {};
                    currentCount = 0;
                    chunkIndex++;
                }
            }
        }
    });

    files.push({
        path: path.join(outputDir, 'index.json'),
        content: JSON.stringify(fileIndexByLetter, null, 2) // Write the file index to index.json
    });

    return files;
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

        let files: FileContent[] = [];
        for (const lang in configOutput.data.writingSystems) {
            const writingSystem = configOutput.data.writingSystems[lang];

            if (writingSystem.reversalFilename && writingSystem.alphabet) {
                if (verbose) {
                    console.log(`Processing reversal index for language: ${lang}`);
                }

                const langFiles = convertReverseIndex(this.dataDir, lang, writingSystem.alphabet);
                files.push(...langFiles);
            }
        }

        return {
            taskName: this.constructor.name,
            files
        };
    }
}
