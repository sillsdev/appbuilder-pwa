import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import path from 'path';
import { Task, TaskOutput } from './Task';
import type { ConfigData } from '$config';

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
    alphabet: string[]
): void {
    const indexFilePath = path.join(dataDir, 'lexicon-en.idx');
    const outputDir = path.join('static', 'reversal', 'language', language);
    const content = readFileSync(indexFilePath, 'utf-8');
    const indexEntries = content.split('\n').map((line) => line.trim().split('\t'));

    const letterHasEntries = new Map<string, boolean>();
    alphabet.forEach(letter => {
        const upperLetter = letter.trim()[0].toUpperCase();
        letterHasEntries.set(upperLetter, false);
    });

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

        alphabet.forEach((letter) => {
            const LETTER = letter.trim()[0].toUpperCase();
            if (letterHasEntries.get(LETTER)) {
                const reverseMap: { [key: string]: Array<{ index: number, name: string }> } = {};

                indexEntries.forEach(([gloss, ids]) => {
                    if (gloss && ids && gloss.trim()[0].toUpperCase() === LETTER) {
                        const idList = ids.split(',').map((id) => parseInt(id.trim()));
                        reverseMap[gloss] = idList.map((id) => ({
                            index: id,
                            name: gloss,
                        }));
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
    public triggerFiles: string[] = ['lexicon-en.idx'];

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

        let glossSystem = writingSystems.find(([_, ws]) => {
            return ws.textDirection === 'gloss';
        });

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

        let alphabet: string[] = [];
        for (const collection of configOutput.data.bookCollections || []) {
            if (collection.languageCode === language && Array.isArray(collection.fonts)) {
                alphabet = collection.fonts;
                break;
            }
        }

        if (!alphabet.length) {
            if (verbose) {
                console.log(`No alphabet found in config for ${language}, extracting from entries`);
            }
            const indexFilePath = path.join(this.dataDir, 'lexicon-en.idx');
            const content = readFileSync(indexFilePath, 'utf-8');
            const indexEntries = content.split('\n').map((line) => line.trim().split('\t'));
            alphabet = extractAlphabet(indexEntries);
        }

        convertReverseIndexForAllLetters(this.dataDir, language, alphabet);

        return {
            taskName: this.constructor.name,
            files: []
        };
    }
}