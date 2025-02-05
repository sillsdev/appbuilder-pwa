import { base } from '$app/paths';
import initSqlJs from 'sql.js';

export async function load({ fetch }) {
    const SQL = await initSqlJs({
        locateFile: (file: string) => `${base}/wasm/${file}`
    });

    // Fetch the database file
    const response = await fetch(`${base}/data.sqlite`);
    const buffer = await response.arrayBuffer();

    // Load the database into sql.js
    const db = new SQL.Database(new Uint8Array(buffer));

    // Example: Running a simple query
    const results = db.exec(
        'SELECT id, name, homonym_index, type, num_senses, summary FROM entries'
    );
    const result = results[0];

    const entries = [];
    for (let value of result.values) {
        const entry = {} as { [key: string]: any };
        for (let i = 0; i < result.columns.length; ++i) {
            entry[result.columns[i]] = value[i];
        }
        entries.push(entry);
    }

    return {
        entries
    };
}
