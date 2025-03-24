import { base } from '$app/paths';
import config from '$lib/data/config';
import initSqlJs from 'sql.js';

const SQL = await initSqlJs({
    locateFile: (file) => `${base}/wasm/sql-wasm.wasm`
});

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

    const response = await fetch(`${base}/data.sqlite`);
    const buffer = await response.arrayBuffer();

    const db = new SQL.Database(new Uint8Array(buffer));
    console.log('Database loaded:', db);

    const results = db.exec(
        `SELECT id, name, homonym_index, type, num_senses, summary FROM entries`
    );
    const result = results[0];
    console.log(result);

    let vernacularWordsList = [];
    if (results[0]) {
        vernacularWordsList = results[0].values.map((value) => {
            const entry = {};
            for (let i = 0; i < results[0].columns.length; ++i) {
                entry[results[0].columns[i]] = value[i];
            }

            let firstLetter = entry.name.charAt(0).toLowerCase();

            let firstTwoChars;
            let startingPosition = 0;

            if (firstLetter === '*' || firstLetter === '-') {
                startingPosition = 1;
            }
            firstTwoChars = entry.name
                .substring(startingPosition, 2 + startingPosition)
                .toLowerCase();

            if (vernacularAlphabet.includes(firstTwoChars)) {
                firstLetter = firstTwoChars;
            } else {
                firstLetter = entry.name.charAt(startingPosition).toLowerCase();
            }

            if (!vernacularAlphabet.includes(firstLetter)) {
                firstLetter = '*';
            }

            entry.letter = firstLetter;
            return entry;
        });
        sessionStorage.setItem('vernacularWordsList', JSON.stringify(vernacularWordsList));
    }

    return {
        fetch,
        vernacularAlphabet,
        vernacularLanguage,
        reversalAlphabets,
        reversalLanguages,
        dictionaryName
    };
}