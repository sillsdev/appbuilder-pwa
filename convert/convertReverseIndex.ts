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

// Setting the ALPHABET as a dynamically loaded variable
const ALPHABET = loadAlphabetFromXML();

/**
 * Reads entries from the data.sqlite database using the command-line sqlite3.
 * Only selects entries where the name starts with the specified letter.
 */
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
    // Always return entryMap, even if an error occurs
    return entryMap;
}

/**
 * Converts the reversal index by mapping glosses to head words from the database, and outputs a JSON file.
 * Generates JSON files for each letter in the alphabet.
 */
function convertReverseIndexForAllLetters(dataDir: string, language: string, verbose: number): void {
    const dbPath = path.join(dataDir, 'data.sqlite');
    const indexFilePath = path.join(dataDir, 'lexicon-en.idx');
    // Output directory includes the language
    const outputDir = path.join(dataDir, `static/reversal/language/${language}`);

    // Ensure the output directory exists, create it if not
    if (!existsSync(outputDir)) {
        mkdirSync(outputDir, { recursive: true });
    }

    // Get entries from the database
    const entries = getEntries(dbPath);

    // Read index file content
    const content = readFileSync(indexFilePath, 'utf-8');
    const indexEntries = content.split('\n').map((line) => line.trim().split('\t'));

    // Iterate over every letter in the alphabet
    ALPHABET.forEach((LETTER) => {
        const reverseMap: { [key: string]: Array<{ index: number, name: string, homonym_index: number }> } = {};

        // Map glosses to corresponding entries, but only those starting with the current LETTER
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

        // Output the JSON structure to a file
        const outputFilePath = path.join(outputDir, `${LETTER.toLowerCase()}.json`);
        writeFileSync(outputFilePath, JSON.stringify(reverseMap, null, 4), 'utf-8');

        if (verbose) {
            console.log(`Reversal index written to ${outputFilePath}`);
        }
    });
}

/**
 * Class representing the ConvertReverseIndex task.
 * This class uses the convertReverseIndex function to generate the reversal index for all letters.
 */

export class ConvertReverseIndex extends Task {
    public triggerFiles: string[] = ['lexicon-en.idx', 'data.sqlite'];

    constructor(dataDir: string) {
        super(dataDir);
    }

    public async run(verbose: number, outputs: Map<string, TaskOutput>): Promise<TaskOutput> {
        // Get config data from previous outputs
        const configOutput = outputs.get('ConvertConfig') as { data: ConfigData } | undefined;
        if (!configOutput || !configOutput.data) {
            throw new Error('Config data not found in outputs');
        }

        // For DAB projects, get the main language from writing systems
        const writingSystems = Object.entries(configOutput.data.interfaceLanguages?.writingSystems || {});
        const mainWritingSystem = writingSystems.find(([, ws]) =>
            ws.displayNames && Object.values(ws.displayNames).length > 0
        );

        if (!mainWritingSystem) {
            throw new Error('No writing system with display names found in config data');
        }

        // Get the first display name as the language name
        const language = Object.values(mainWritingSystem[1].displayNames)[0];
        if (!language) {
            throw new Error('Language name not found in writing system display names');
        }

        // Call convertReverseIndex for all letters with the language from config
        convertReverseIndexForAllLetters(this.dataDir, language, verbose);

        // Collect the generated files
        const outputDir = path.join(this.dataDir, `static/reversal/language/${language}`);
        const files = ALPHABET.map((LETTER) => {
            const outputFilePath = path.join(outputDir, `${LETTER.toLowerCase()}.json`);
            const outputContent = readFileSync(outputFilePath, 'utf-8');
            return { path: outputFilePath, content: outputContent };
        });

        // Return the TaskOutput including the file paths and content for all files
        return {
            taskName: this.constructor.name,
            files: files,
        };
    }
}