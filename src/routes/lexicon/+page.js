import { base } from '$app/paths';
import config from '$lib/data/config';
import initSqlJs from 'sql.js';

/** @type {import('./$types').PageLoad} */
export async function load({ fetch }) {
    if (!config.writingSystems) {
        throw new Error('Writing systems configuration not found');
    }

    const vernacularWritingSystem = Object.values(config.writingSystems).find(
        (ws) => ws.type.includes('main')
    );

    if (!vernacularWritingSystem) {
        throw new Error('Vernacular language not found');
    }

    const vernacularAlphabet = vernacularWritingSystem.alphabet;
    const vernacularLanguage = vernacularWritingSystem.displayNames.default;
    
    const reversalWritingSystems = Object.entries(config.writingSystems).filter(
        ([key, ws]) => !ws.type.includes('main')
    );

    if (!reversalWritingSystems) {
        throw new Error('Reversal language not found');
    }

    const reversalAlphabets = reversalWritingSystems.map(([key, ws]) => ({ [key]: ws.alphabet }));
    const reversalLanguages = reversalWritingSystems.map(([key, ws]) => ({ [key]: ws.displayNames.default }));
    
    const dictionaryName = config.name;

    const SQL = await initSqlJs({
        locateFile: (file) => `${base}/wasm/sql-wasm.wasm`
    });

    // Fetch the database file
    const response = await fetch(`${base}/data.sqlite`);
    const buffer = await response.arrayBuffer();

    // Load the database into sql.js
    const db = new SQL.Database(new Uint8Array(buffer));
    console.log('Database loaded:', db);

    // Example: Running a simple query for words of the first letter of the alphabet
    const results = db.exec(
        `SELECT id, name, homonym_index, type, num_senses, summary FROM entries WHERE REPLACE(name, '-', '') LIKE "${vernacularAlphabet[0]}%"`
    );
    const result = results[0];
    console.log(result);

    const entries = [];
    for (let value of result.values) {
        const entry = {};
        for (let i = 0; i < result.columns.length; ++i) {
            entry[result.columns[i]] = value[i];
        }
        entries.push(entry);
    }
    console.log(entries);

    return {
        fetch,
        vernacularAlphabet,
        vernacularLanguage,
        reversalAlphabets,
        reversalLanguages,
        dictionaryName
    };
}