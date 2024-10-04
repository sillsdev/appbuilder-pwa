import { readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { TaskOutput, Task } from './Task';

/**
 * Reads entries from the data.sqlite database using the command-line sqlite3.
 */
function getEntries(dbPath: string): Map<number, string> {
    const entryMap = new Map<number, string>();
    try {
        const query = 'SELECT id, name FROM entries';
        const command = `sqlite3 "${dbPath}" "${query}"`;
        const result = execSync(command).toString();

        result.split('\n').forEach((line) => {
            const [idStr, name] = line.split('|');
            if (idStr && name) {
                entryMap.set(parseInt(idStr.trim()), name.trim());
            }
        });
    } catch (error) {
        console.error('Error executing sqlite3 command:', error);
    }
    return entryMap;
}

/**
 * Converts the reversal index by mapping glosses to head words from the database.
 */
export function convertReverseIndex(dataDir: string, verbose: number): string {
    const dbPath = path.join(dataDir, 'data.sqlite');
    const indexFilePath = path.join(dataDir, 'lexicon-en.idx');

    // Get entries from the database
    const entries = getEntries(dbPath);

    // Read index file content
    const content = readFileSync(indexFilePath, 'utf-8');
    const indexEntries = content.split('\n').map((line) => line.trim().split('\t'));

    // Map glosses to entries
    const reverseMap: { [key: string]: string[] } = {};
    indexEntries.forEach(([gloss, ids]) => {
        if (gloss && ids) {
            const idList = ids.split(',').map((id) => id.trim());
            reverseMap[gloss] = idList;
        }
    });

    // Map glosses to corresponding head words
    const reverseIndexOutput: string[] = [];
    Object.entries(reverseMap).forEach(([gloss, idList]) => {
        const headWords = idList.map((id) => entries.get(parseInt(id)) || 'UNKNOWN');
        reverseIndexOutput.push(`${gloss} -> ${headWords.join(', ')}`);
    });

    // Join the output as a string
    const outputContent = reverseIndexOutput.join('\n');

    if (verbose) console.log(`Generated reverse index content`);

    return outputContent;
}

export class ConvertReverseIndex extends Task {
    public triggerFiles: string[] = ['lexicon-en.idx', 'data.sqlite'];

    constructor(dataDir: string) {
        super(dataDir);
    }

    public async run(verbose: number, outputs: Map<string, TaskOutput>): Promise<TaskOutput> {
        // Call convertReverseIndex and get the generated content
        const outputContent = convertReverseIndex(this.dataDir, verbose);

        // Define the output file path
        const outputPath = path.join(this.dataDir, 'reverse_index_output.txt');

        // Write the content to the output file
        writeFileSync(outputPath, outputContent, 'utf-8');

        // Return the TaskOutput including the file path and content
        return {
            taskName: this.constructor.name,
            files: [{ path: outputPath, content: outputContent }],
        };
    }
}

// import { TaskOutput, Task } from './Task';
// import path from 'path';
// import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';

// // Core function to handle the reversal index conversion logic
// export function convertReverseIndex(dataDir: string, verbose: number) {
//     const indexDir = path.join(dataDir, 'indexes');

//     // Ensure the index directory exists
//     if (!existsSync(indexDir)) {
//         mkdirSync(indexDir);
//     }

//     // Process all reversal index files in the data directory
//         //const idxFilePattern = path.join(dataDir, 'lexicon-*.idx');
//     const idxFiles = [path.join(dataDir, 'lexicon-en.idx')]; // Replace this with glob if you want to search for all matching files

//     // Read and process each reversal index file
//     const outputFiles: { path: string; content: string }[] = []; // Array to hold output file data

//     idxFiles.forEach((filename) => {
//         const filePath = path.join(dataDir, filename);
//         if (existsSync(filePath)) {
//             if (verbose) console.log(`Processing index file: ${filename}`);

//             // Read index file content
//             const content = readFileSync(filePath, 'utf-8');
//             const entries = content.split('\n').map((line) => line.trim().split('\t'));

//             // Map glosses to entries
//             const reverseMap: { [key: string]: string[] } = {};
//             entries.forEach(([gloss, ids]) => {
//                 if (gloss && ids) {
//                     const idList = ids.split(',').map((id) => id.trim());
//                     reverseMap[gloss] = idList;
//                 }
//             });

//             // Output file path (e.g., `data/indexes/reverse-en.json`)
//             const outputFilePath = path.join(indexDir, `reverse-${path.basename(filename, '.idx')}.json`);
//             const outputContent = JSON.stringify(reverseMap, null, 2);

//             // Write the content to file
//             writeFileSync(outputFilePath, outputContent);
//             if (verbose) console.log(`Generated reverse index: ${outputFilePath}`);

//             // Add output file data to the array
//             outputFiles.push({ path: outputFilePath, content: outputContent });
//         }
//     });

//     return outputFiles; // Return the output files array
// }

// export class ConvertReverseIndex extends Task {
//     public triggerFiles: string[];

//     constructor(dataDir: string) {
//         super(dataDir);
//         this.triggerFiles = [path.join(dataDir, 'lexicon-en.idx')]; // Add more files as needed
//     }

//     public async run(verbose: number, outputs: Map<string, TaskOutput>): Promise<TaskOutput> {
//         const outputFiles = convertReverseIndex(this.dataDir, verbose);
//         return {
//             taskName: this.constructor.name,
//             files: outputFiles, // Now correctly formatted as required
//         };
//     }
// }


// import { TaskOutput, Task } from './Task';
// import { execSync } from 'child_process';
// import fs from 'fs';
// import path from 'path';

// // Function to read the entries from the data.sqlite database using command-line sqlite3
// function getEntries(dbPath: string): Map<number, string> {
//     const entryMap = new Map<number, string>();

//     try {
//         const query = 'SELECT id, name FROM entries';
//         const command = `sqlite3 "${dbPath}" "${query}"`;
//         const result = execSync(command).toString();

//         result.split('\n').forEach((line) => {
//             const [idStr, name] = line.split('|');
//             if (idStr && name) {
//                 entryMap.set(parseInt(idStr.trim()), name.trim());
//             }
//         });
//     } catch (error) {
//         console.error('Error executing sqlite3 command:', error);
//     }

//     return entryMap;
// }

// // Function to parse the reversal index file and map glosses to entries
// function parseReversalIndex(filePath: string): Map<string, number> {
//     const glossToIdMap = new Map<string, number>();
//     const content = fs.readFileSync(filePath, 'utf-8');
//     const lines = content.split('\n');

//     lines.forEach((line) => {
//         const [gloss, idStr] = line.split('\t');
//         if (gloss && idStr) {
//             glossToIdMap.set(gloss.trim(), parseInt(idStr.trim()));
//         }
//     });

//     return glossToIdMap;
// }

// export class ConvertReverseIndex extends Task {
//     public triggerFiles: string[];

//     constructor(dataDir: string) {
//         super(dataDir);
//         this.triggerFiles = [`${dataDir}/index-en.idx`, `${dataDir}/data.sqlite`];
//     }

//     public async run(verbose: number, outputs: Map<string, TaskOutput>): Promise<TaskOutput> {
//         const dbPath = path.join(this.dataDir, 'data.sqlite');
//         const indexFilePath = path.join(this.dataDir, 'index-en.idx');

//         // Get the entries from the SQLite database using the command-line
//         const entries = getEntries(dbPath);

//         // Read the reversal index file
//         const glossToIdMap = parseReversalIndex(indexFilePath);

//         // Map glosses to corresponding head words
//         const reverseIndexOutput: string[] = [];

//         glossToIdMap.forEach((id, gloss) => {
//             const headWord = entries.get(id) || 'UNKNOWN';
//             reverseIndexOutput.push(`${gloss} -> ${headWord}`);
//         });

//         // Output results to a file
//         const outputPath = path.join(this.dataDir, 'reverse_index_output.txt');
//         fs.writeFileSync(outputPath, reverseIndexOutput.join('\n'), 'utf-8');

//         return {
//             taskName: this.constructor.name,
//             files: [{ path: outputPath, content: reverseIndexOutput.join('\n') }],
//         };
//     }
// }
