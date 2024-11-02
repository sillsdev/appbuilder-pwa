import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { Task, TaskOutput } from './Task';
import fs from 'fs';
import type { ConfigData } from '$config';

// Function to load ALPHABET from appdef.xml
function loadAlphabetFromXML() {
    const xmlPath = path.resolve(__dirname, '../data/appdef.xml');
    const xmlData = fs.readFileSync(xmlPath, 'utf8');

    // Use regex to find the alphabet within a type="gloss" writing-system
    const alphabetMatch = xmlData.match(/<writing-system[^>]*type="gloss"[^>]*>[\s\S]*?<alphabet>(.*?)<\/alphabet>/);

    if (alphabetMatch && alphabetMatch[1]) {
        // Split the matched alphabet string by whitespace into an array of characters
        return alphabetMatch[1].trim().split(' ');
    } else {
        throw new Error("Alphabet with type='gloss' not found in appdef.xml");
    }
}

const ALPHABET = loadAlphabetFromXML();

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

function convertReverseIndexForAllLetters(dataDir: string, language: string, verbose: number): void {
    const dbPath = path.join(dataDir, 'data.sqlite');
    const indexFilePath = path.join(dataDir, 'lexicon-en.idx');

    // Modified: Output directory now points to the static folder
    const outputDir = path.join(__dirname, '../static/reversal/language', language);

    // Read entries from database
    const entries = getEntries(dbPath);

    // Read index file content
    const content = readFileSync(indexFilePath, 'utf-8');
    const indexEntries = content.split('\n').map((line) => line.trim().split('\t'));

    // Create a map to track which letters have entries
    const letterHasEntries = new Map<string, boolean>();
    ALPHABET.forEach(letter => letterHasEntries.set(letter, false));

    // First pass: check which letters have entries
    indexEntries.forEach(([gloss, ids]) => {
        if (gloss && ids) {
            const firstLetter = gloss[0].toUpperCase();
            ALPHABET.forEach(letter => {
                if (gloss.startsWith(letter)) {
                    letterHasEntries.set(letter, true);
                }
            });
        }
    });

    // Check if any letter has entries before creating the directory
    const hasAnyEntries = Array.from(letterHasEntries.values()).some(hasEntries => hasEntries);

    if (hasAnyEntries) {
        // Ensure the output directory exists only if we have entries
        if (!existsSync(outputDir)) {
            mkdirSync(outputDir, { recursive: true });
        }

        // Process each letter
        ALPHABET.forEach((LETTER) => {
            if (letterHasEntries.get(LETTER)) {
                const reverseMap: { [key: string]: Array<{ index: number, name: string, homonym_index: number }> } = {};

                // Map glosses to corresponding entries
                indexEntries.forEach(([gloss, ids]) => {
                    if (gloss && ids && gloss.startsWith(LETTER)) {
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

                // Only create the file if we have entries for this letter
                if (Object.keys(reverseMap).length > 0) {
                    const outputFilePath = path.join(outputDir, `${LETTER.toLowerCase()}.json`);
                    writeFileSync(outputFilePath, JSON.stringify(reverseMap, null, 4), 'utf-8');

                    if (verbose) {
                        console.log(`Reversal index written to ${outputFilePath}`);
                    }
                }
            }
        });
    } else if (verbose) {
        console.log(`No entries found for language ${language}, skipping directory creation`);
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

        const writingSystems = Object.entries(configOutput.data.interfaceLanguages?.writingSystems || {});
        const mainWritingSystem = writingSystems.find(([, ws]) =>
            ws.displayNames && Object.values(ws.displayNames).length > 0
        );

        if (!mainWritingSystem) {
            throw new Error('No writing system with display names found in config data');
        }

        const language = Object.values(mainWritingSystem[1].displayNames)[0];
        if (!language) {
            throw new Error('Language name not found in writing system display names');
        }

        convertReverseIndexForAllLetters(this.dataDir, language, verbose);

        // Return TaskOutput with file information
        return {
            taskName: this.constructor.name,
            files: [], // The files are written directly to the static directory
        };
    }
}