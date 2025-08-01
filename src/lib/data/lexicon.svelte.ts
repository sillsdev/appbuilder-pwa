// Runes-based db access for lexicon, let's give it a go.
import { base } from '$app/paths';
import initSqlJs, { Database } from 'sql.js';
import type { DictionaryConfig, DictionaryWritingSystemConfig } from '$config';

function createLexicon() {
    let sqlJs: typeof initSqlJs = null;
    let sqlDb: Database = null;
    let xmlData = $state('');
    let vernacularWords: Array<VernacularWord> = $state();
    let vernacularWritingSystem: DictionaryWritingSystemConfig;
    let vernacularAlphabet: string | any[];
    let vernacularLanguage: string = $state();




    interface Vernacular {
        words: Array<VernacularWord>;
    }

    let vernacular: Vernacular = {
        words: []
    };

    interface Reversal {
        words: Record<string, ReversalWord[]>;
        letters: Record<string, string[]>;
        indexes: { [language: string]: ReversalIndex };
        writingSystems: DictionaryWritingSystemConfig[];
        alphabets: Record<string, string[]>;
    }

    let reversals: Reversal = $state({
        words: {},
        letters: {},
        indexes: {},
        writingSystems: [],
        alphabets: {}
    });

    let reversalWritingSystems: any = $state();
    const reversalAlphabets = $derived.by(() => {
        if (reversalWritingSystems) {
            return reversalWritingSystems.reduce((obj: { [x: string]: any; }, [key, ws]: any) => {
                obj[key] = ws.alphabet;
                return obj;
            }, {});
        } else {
            return undefined;
        }
    });

    const reversalLanguages = {};
    const reversalKeys = {};

    function currentReversalWords(language): ReversalWord[] {
        if (reversals.words[language]) {
            return reversals.words[language];
        }
        return [];
    }

    function currentReversalLetters(language): string[] {
        if (reversals.letters[language]) {
            return reversals.letters[language];
        }
        return [];
    }

    function alphabets() {
        return {
            vernacular: vernacularAlphabet,
            reversal: reversalAlphabets,
            keys: reversalKeys
        };
    }

    function formatXmlByClass(xmlString: string): string {
        if (!xmlString) {
            return '';
        }

        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlString, 'text/xml');

        const parseError = xmlDoc.querySelector('parsererror');
        if (parseError) {
            console.error('XML parsing error:', parseError.textContent);
            return `<span class="text-error" style="background-color: var(--BackgroundColor);">Error parsing XML: Invalid format</span>`;
        }

        function processNode(node: HTMLElement, parentHasSenseNumber = false) {
            let output = '';

            if (node.nodeType === Node.TEXT_NODE) {
                return node.nodeValue.trim() ? node.nodeValue + ' ' : '';
            }

            if (node.nodeType === Node.ELEMENT_NODE) {
                let className = node.getAttribute('class') || '';
                let isSenseNumber = className.includes('sensenumber');

                let parentContainsSenseNumber =
                    parentHasSenseNumber ||
                    [...node.parentNode.children].some(
                        (child) =>
                            child.getAttribute &&
                            (child.getAttribute('class') || '').includes('sensenumber')
                    );

                const addStyle =
                    node.tagName === 'span' ||
                    className === 'clickable cursor-pointer' ||
                    (node.tagName === 'div' && className === 'entry');

                if (node.tagName === 'a' && node.hasAttribute('href')) {
                    const href = node.getAttribute('href');
                    const match = href.match(/E-(\d+)/);
                    if (match) {
                        const index = parseInt(match[1], 10);
                        const wordObject = vernacularWords.find(
                            (item: { id: number }) => item.id === index
                        );
                        const word = wordObject ? wordObject.word : 'Unknown';
                        const homonymIndex = wordObject ? wordObject.homonym_index : 1;

                        let linkText = node.textContent.trim();

                        if (linkText === String(homonymIndex)) {
                            linkText = homonymIndex.toString();
                        }

                        output += `<span class="clickable cursor-pointer" style="background-color: var(--BackgroundColor);" data-word="${word}" data-index="${index}" data-homonym="${homonymIndex}">${linkText}</span>`;
                    }
                } else {
                    output += `<${node.tagName}`;
                    for (let attr of node.attributes) {
                        output += ` ${attr.name}="${attr.value}"`;
                    }

                    // Add appropriate styling based on class name

                    const classNameStyle = {
                        sensenumber: ` style="color: var(--TextColor); font-weight: bold;"`,
                        vernacular: ` style="color: var(--TextColor2);"`,
                        example: ` style="color: var(--TextColor3); font-style: italic;"`,
                        definition: ` style="color: var(--TextColor); font-weight: normal;"`
                    };

                    for (let m in classNameStyle) {
                        if (className.includes(m)) {
                            output += classNameStyle[m];
                            break;
                        }
                    }

                    if (addStyle) {
                        output += ` style="background-color: var(--BackgroundColor); color: var(--TextColor);"`;
                    }

                    output += '>';

                    for (let child of node.childNodes) {
                        output += processNode(child, parentContainsSenseNumber || isSenseNumber);
                    }

                    output += `</${node.tagName}>`;
                }
            }

            return output;
        }

        return processNode(xmlDoc.documentElement);
    }

    /* Fetching functions */
    /* Frequently it is desirable to use a custom fetch function while fetching lexicon sources.
     * A good example of this is in +page.ts, where a special fetch function is given to us.
     * In these cases, use `withFetch()` to specify the fetch function.
     * All functions that rely on fetch ought to be defined inside withFetch(). */

    function withFetch({ fetch }) {
        async function fetchReversalIndexes(writingSystems: any): Promise<void> {
            for (const [key, ws] of writingSystems) {
                if (!ws.type.includes('main')) {
                    const response = await fetch(`${base}/reversal/${key}/index.json`);
                    if (response.ok) {
                        reversals.indexes[key] = (await response.json()) as ReversalIndex; // Explicitly cast the JSON response
                    } else {
                        console.warn(`Failed to load reversal index for language: ${key}`);
                    }
                }
            }
        }

        async function fetchReversalLetterData({ letter, language }) {
            if (language === vernacularLanguage) {
                return; // The vernacularLanguage is already loaded by setup!
            }

            if (reversals.letters[language].includes(letter)) {
                return; // The letter is already loaded!
            }

            reversals.letters[language].push(letter);
            const newWords = [];
            const defaultReversalKey = reversalKeys[language];
            const index = reversals.indexes[defaultReversalKey];
            const files = index[letter] || [];
            try {
                for (const file of files) {
                    const reversalFile = `${base}/reversal/${defaultReversalKey}/${file}`;
                    const response = await fetch(reversalFile);
                    if (response.ok) {
                        const data = await response.json();
                        const currentFileWords = Object.entries(data).map(([word, entries]) => {
                            return {
                                word,
                                indexes: entries.map((entry: { index: any }) => entry.index),
                                vernacularWords: entries
                                    .map((entry: { index: number }) => {
                                        const foundWord = vernacularWords.find(
                                            (vw) => vw.id === entry.index
                                        );
                                        if (foundWord) {
                                            return {
                                                word: foundWord.word,
                                                homonymIndex: foundWord.homonym_index || 0
                                            };
                                        } else {
                                            console.log(
                                                `Index ${entry.index} not found in vernacularWordsList`
                                            );
                                            return null; // Return null for missing indexes
                                        }
                                    })
                                    .filter((index: null) => index !== null), // Filter out null values
                                letter: letter
                            };
                        });

                        currentFileWords.forEach((newWord) => {
                            const existingWord = reversals.words[language].find(
                                (w) => w.word === newWord.word
                            );
                            if (existingWord) {
                                existingWord.indexes = [
                                    ...new Set([...existingWord.indexes, ...newWord.indexes])
                                ];
                            } else {
                                newWords.push(newWord);
                            }
                        });
                    }
                }
            } catch (error) {
                reversals.letters[language] = reversals.letters[language].filter(l => l !== letter);
                console.error(`Error fetching data for letter ${letter}:`, error);
                return;
            }
            reversals.words[language] = [...reversals.words[language], ...newWords];
        }

        async function fetchReversalWords({ letter, language }) {

            const reversalAlphabet: string[] = $state.snapshot(reversalAlphabets[reversalKeys[language]]);

            if (!reversals.letters[language]) {
                reversals.letters[language] = [];
            }
            if (!reversals.words[language]) {
                reversals.words[language] = [];
            }


            console.log(letter);
            console.log($state.snapshot(reversals.letters[language]));
            if (reversals.letters[language].includes(letter)) {
                // Reversal already contains the letter we want.
                console.log("skip");
                return;
            }


            const letterIndex = reversalAlphabet.indexOf(letter);
            const lettersToLoad = reversalAlphabet
                .slice(0, letterIndex + 1)
                .filter((l: string) => !reversals.letters || !(reversals.letters[language].includes(l)));

            await Promise.all(
                lettersToLoad.map(letter => fetchReversalLetterData({ letter, language })),
            );

            reversals.words[language].sort((a, b) => {
                return (
                    reversalAlphabet.indexOf(a.word[0].toLowerCase()) -
                    reversalAlphabet.indexOf(b.word[0].toLowerCase())
                );
            });
        }

        async function setup(config: DictionaryConfig) {
            vernacularWritingSystem = Object.values(config.writingSystems).find((ws) =>
                ws.type.includes('main')
            );

            vernacularAlphabet = vernacularWritingSystem.alphabet;
            vernacularLanguage = vernacularWritingSystem.displayNames.default;

            selected.language = vernacularLanguage;
            const wsConfig = Object.entries(config.writingSystems);
            reversalWritingSystems = wsConfig;

            wsConfig.reduce((obj: { [x: string]: any; }, [key, ws]: any) => {
                obj[key] = ws.displayNames.default;
                return obj;
            }, reversalLanguages);
            Object.entries(reversalLanguages).map(([k, v]: [string, string]) => reversalKeys[v] = k);

            Promise.all([
                fetchAllWords(vernacularAlphabet),
                fetchReversalIndexes(reversalWritingSystems)
            ]);
        }

        async function fetchAllWords(alphabet: string | any[]) {
            let results = await queryXML(
                `SELECT id, name, homonym_index, type, num_senses, summary FROM entries`
            );

            if (!results || results.length === 0) {
                throw new Error('Vernacular query error');
            }

            let wordlist = results[0].values.map((value: { [x: string]: any }) => {
                const entry = results[0].columns.reduce(
                    (
                        acc: { [x: string]: any },
                        column: string | number,
                        index: string | number
                    ) => {
                        acc[column] = value[index];
                        return acc;
                    },
                    {}
                );

                let firstLetter = entry.name.charAt(0).toLowerCase();

                let firstTwoChars: any;
                let startingPosition = 0;

                if (firstLetter === '*' || firstLetter === '-') {
                    startingPosition = 1;
                }
                firstTwoChars = entry.name
                    .substring(startingPosition, 2 + startingPosition)
                    .toLowerCase();

                if (alphabet.includes(firstTwoChars)) {
                    firstLetter = firstTwoChars;
                } else {
                    firstLetter = entry.name.charAt(startingPosition).toLowerCase();
                }

                if (!alphabet.includes(firstLetter)) {
                    firstLetter = '*';
                }

                // Remap 'name' to 'word' for consistency with reversalWord.
                Object.defineProperty(entry, 'word',
                    Object.getOwnPropertyDescriptor(entry, 'name'));
                delete entry['name'];
                entry.letter = firstLetter;
                return entry;
            });

            vernacularWords = wordlist;
        }

        async function initializeDatabase() {
            // TODO fix caching error: database fails if cache is cleared and page refreshed.
            // How can I tell if the cache is emptied? How can I remove the DB?
            let db = sqlDb;
            if (!sqlJs && !sqlDb) {
                // Fetch the WebAssembly binary manually using SvelteKit's fetch
                const wasmResponse = await fetch(`${base}/wasm/sql-wasm.wasm`);
                const wasmBinary = await wasmResponse.arrayBuffer();

                // Initialize sql.js with the manually loaded wasm binary
                let sql = await initSqlJs({ wasmBinary });
                sqlJs = sql;

                // Fetch the database file
                const response = await fetch(`${base}/data.sqlite`);
                const buffer = await response.arrayBuffer();

                // Load the database into sql.js
                db = new sql.Database(new Uint8Array(buffer));
                sqlDb = db;
            }
            //return db;
        }

        async function queryXmlByWordId(wordIds: any[]): Promise<ArrayIterator<string>> {
            try {
                await initializeDatabase();

                let results: string[][];
                const dynamicQuery = wordIds.map(() => `id = ?`).join(' OR ');
                const dynamicParams = wordIds.map((id: any) => id);
                results = sqlDb.exec(
                    `SELECT xml FROM entries WHERE ${dynamicQuery}`,
                    dynamicParams
                );

                return results[0].values;
            } catch (error) {
                console.error(`Error querying XML for word IDs ${wordIds}:`, error);
                return null;
            }
        }

        async function search(wordIds: any[]) {
            let xmlResults: ArrayIterator<string> = await queryXmlByWordId(wordIds);
            if (!wordIds) {
                xmlData = '';
                return;
            }

            // Insert an `<hr>` tag or a visible separator between entries
            xmlData =
                xmlResults
                    .filter((xml) => xml) // Ensure no null values are included
                    .map(formatXmlByClass)
                    .join('\n<hr style="border-color: var(--SettingsSeparatorColor);">\n') +
                '\n<hr style="border-color: var(--SettingsSeparatorColor);">\n';

            return;
        }

        async function queryXML(q: any): Promise<any> {
            try {
                await initializeDatabase();
                return sqlDb.exec(q);
            } catch (error) {
                console.error(`Error querying XML with query ${q}.\nerror:`, error);
                return null;
            }
        }

        return {
            setup,
            search,
            fetchReversalWords,
            fetchAllWords,
            queryXML,
            fetchReversalIndexes,
            fetchReversalLetterData
        };
    }

    /* Getters and Setters */
    function data() {
        return xmlData;
    }

    function currentVernacularWords() {
        return vernacularWords;
    }
    function languages() {
        return { vernacularLanguage, reversalLanguages };
    }

    return {
        alphabets,
        languages,
        data,
        currentVernacularWords,
        currentReversalWords,
        currentReversalLetters,
        withFetch,
        ...withFetch({ fetch })
    };
}

export interface ReversalIndex {
    // Maps a letter to an array of file names
    [letter: string]: string[];
}

export interface VernacularWordReference {
    word: string;
    homonym_index: number;
}

export interface VernacularWord {
    id: number;
    word: string;
    homonym_index: number;
}

export interface ReversalWord {
    word: string;
    indexes: string[];
    vernacularWords: VernacularWordReference[];
    letter: string;
}

export const lexicon = createLexicon();
export let selected = $state({ language: "" });
