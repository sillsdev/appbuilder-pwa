import initSqlJs from 'sql.js';

// Handle direct messages from the main thread
self.addEventListener('message', async (event) => {
    const message = event.data;

    if (message.type === 'search') {
        try {
            const results = await searchDictionary(message.phrase, message.options);
            self.postMessage({
                type: 'searchResults',
                results: results
            });
        } catch (error) {
            console.error('Search error:', error);
            self.postMessage({
                type: 'searchError',
                error: error.message
            });
        }
    }
});

// Open the database and load data from it
async function openDatabase() {
    try {
        const SQL = await initSqlJs({
            locateFile: (file) => `/wasm/sql-wasm.wasm`
        });

        const response = await fetch(`/data.sqlite`);
        if (!response.ok) {
            throw new Error(`Failed to fetch database: ${response.status} ${response.statusText}`);
        }

        const buffer = await response.arrayBuffer();
        const db = new SQL.Database(new Uint8Array(buffer));

        console.log('Database loaded successfully');
        return db;
    } catch (error) {
        console.error('Error opening database:', error);
        throw error;
    }
}

interface SearchResult {
    id: number;
    weight: number;
    name?: string;
    homonym_index?: number;
}

// Search the dictionary based on the phrase and options
async function searchDictionary(phrase: string, options: { wholeWords: boolean, matchAccents: boolean }) {
    if (!phrase || phrase.trim() === '') {
        return [];
    }

    const db = await openDatabase();

    try {
        // TODO: Implement matchAccents option - currently using word_no_accents column for all searches
        const column = 'word_no_accents'; // Later use options.matchAccents ? 'word' : 'word_no_accents';

        let searchPattern = phrase;

        // Add space boundaries for whole word searches
        if (options.wholeWords) {
            // Note: SQLite LIKE patterns need to match entire column, so we add % on both sides
            // to match if the word appears anywhere in the column content
            searchPattern = `% ${phrase} %`;
        } else {
            searchPattern = `%${phrase}%`;
        }

        // Query the search_words table to find matching entries
        const stmt = db.prepare(`SELECT locations FROM search_words WHERE ${column} LIKE ?`);
        stmt.bind([searchPattern]);

        let locationsText = '';
        if (stmt.step()) {
            locationsText = stmt.getAsObject().locations as string;
        }
        stmt.free();

        if (!locationsText) {
            return [];
        }

        // Parse locations string: "1330(20) 1644(20) 2743(20)..." into array of {id, weight} objects
        const locations = locationsText.split(' ').map(loc => {
            const parts = loc.match(/(\d+)\((\d+)\)/);
            if (parts) {
                return {
                    id: parseInt(parts[1], 10),
                    weight: parseInt(parts[2], 10)
                };
            }
            return null;
        }).filter(Boolean) as SearchResult[];

        // Sort results by weight (highest first)
        const sortedResults = locations.sort((a, b) => b.weight - a.weight);

        // Fetch additional information about each entry
        const results = await Promise.all(
            sortedResults.map(async (result) => {
                try {
                    const entryStmt = db.prepare('SELECT name, homonym_index FROM entries WHERE id = ?');
                    entryStmt.bind([result.id]);

                    if (entryStmt.step()) {
                        const entry = entryStmt.getAsObject();
                        result.name = entry.name as string;
                        result.homonym_index = entry.homonym_index as number;
                    }
                    entryStmt.free();
                } catch (error) {
                    console.error(`Error fetching entry details for ID ${result.id}:`, error);
                }

                return result;
            })
        );

        db.close();
        return results;

    } catch (error) {
        console.error('Error searching dictionary:', error);
        db.close();
        throw error;
    }
}