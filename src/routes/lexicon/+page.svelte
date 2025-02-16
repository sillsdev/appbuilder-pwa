<script>
    import { goto } from '$app/navigation';
    import { base } from '$app/paths';
    import { page } from '$app/state';
    import LexiconReversalView from '$lib/components/LexiconReversalView.svelte';
    import LexiconXmlView from '$lib/components/LexiconXMLView.svelte';
    import Navbar from '$lib/components/Navbar.svelte';
    import config from '$lib/data/config';
    import { onMount } from 'svelte';
    import initSqlJs from 'sql.js';

    const {fetch, vernacularAlphabet, vernacularLanguage, reversalAlphabets, reversalLanguages, dictionaryName} = page.data;

    const alphabets = {
        reversal: Object.values(reversalAlphabets[0])[0], //using the first (and only) reversal language for now
        vernacular: vernacularAlphabet
    };

    let selectedLetter = alphabets.vernacular[0];
    let selectedLanguage = vernacularLanguage;
    let selectedWord = null;
    
    let loadedReversalLetters = new Set();
    let loadedVernacularLetters = new Set();
    let reversalWordsList = [];
    let vernacularWordsList = [];
    const defaultReversalKey = Object.keys(reversalAlphabets[0])[0]; //using the first (and only) reversal language for now
    const reversalLanguage = Object.values(reversalLanguages[0])[0];

    // Function to query vernacular words for selected letter with lazy loading
    async function queryVernacularWords() {
        if (selectedLanguage === vernacularLanguage) {
            if (!loadedVernacularLetters.has(selectedLetter)) {

                const SQL = await initSqlJs({
                    locateFile: (file) => `${base}/wasm/sql-wasm.wasm`
                });

                // Fetch the database file
                const response = await fetch(`${base}/data.sqlite`);
                const buffer = await response.arrayBuffer();

                // Load the database into sql.js
                const db = new SQL.Database(new Uint8Array(buffer));
                console.log('Database loaded:', db);

                // Backfill for previous letters
                const letterIndex = alphabets.vernacular.indexOf(selectedLetter);
                for (let i = 0; i <= letterIndex; i++) {
                    if (!loadedVernacularLetters.has(alphabets.vernacular[i])) {
                        // Example: Running a simple query for words of the first letter of the alphabet
                        const results = db.exec(
                            `SELECT id, name, homonym_index, type, num_senses, summary FROM entries WHERE REPLACE(name, '-', '') LIKE "${alphabets.vernacular[i]}%"`
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

                        // Append only the new words to the list
                        vernacularWordsList = [...vernacularWordsList, ...entries];

                        loadedVernacularLetters.add(alphabets.vernacular[i]);
                    }
                }
            }
        }
        // Scroll to the selected letter after loading
        scrollToLetter(selectedLetter);
    }

    // Function to fetch reversal words for selected letter with lazy loading
    async function fetchReversalWords() {
        if (selectedLanguage === reversalLanguage) {
            let fileIndex = 1;
            let moreFiles = true;

            // Fetch words for the selected letter if not already loaded
            if (!loadedReversalLetters.has(selectedLetter)) {
                // Avoid resetting the list on every fetch
                let newWords = [];

                // Backfill for previous letters
                const letterIndex = alphabets.reversal.indexOf(selectedLetter);
                for (let i = 0; i < letterIndex; i++) {
                    if (!loadedReversalLetters.has(alphabets.reversal[i])) {
                        await loadLetterData(alphabets.reversal[i]);
                    }
                }

                // Fetch data for the selected letter
                while (moreFiles) {
                    try {
                        const response = await fetch(
                            `${base}/reversal/${defaultReversalKey}/${selectedLetter}-${String(fileIndex).padStart(3, '0')}.json`
                        );
                        if (response.ok) {
                            const data = await response.json();
                            const currentFileWords = Object.entries(data)
                                .map(([word, entries]) => {
                                    return entries.map((entry) => ({
                                        word: word,
                                        index: entry.index,
                                        letter: selectedLetter // Keep track of the correct letter for the word
                                    }));
                                })
                                .flat();
                            newWords = [...newWords, ...currentFileWords]; // Append only new words
                            fileIndex++;
                        } else {
                            moreFiles = false;
                        }
                    } catch (error) {
                        console.error('Error loading word data:', error);
                    }
                }

                // Append only the new words to the list
                reversalWordsList = [...reversalWordsList, ...newWords];

                // Mark the letter as loaded
                loadedReversalLetters.add(selectedLetter);
            }
            // Scroll to the selected letter after loading
            scrollToLetter(selectedLetter);
        }
    }

    // Helper function to load a single letter's data
    async function loadLetterData(letter) {
        let fileIndex = 1;
        let moreFiles = true;

        while (moreFiles) {
            try {
                const response = await fetch(
                    `${base}/reversal/${defaultReversalKey}/${letter}-${String(fileIndex).padStart(3, '0')}.json`
                );
                if (response.ok) {
                    const data = await response.json();
                    const currentFileWords = Object.entries(data)
                        .map(([word, entries]) => {
                            return entries.map((entry) => ({
                                word: word,
                                index: entry.index
                            }));
                        })
                        .flat();
                    reversalWordsList = [...reversalWordsList, ...currentFileWords];
                    fileIndex++;
                } else {
                    moreFiles = false;
                }
            } catch (error) {
                console.error('Error loading word data:', error);
            }
        }

        loadedReversalLetters.add(letter);
    }

    // Function to handle the click event on a word
    function selectWord(word) {
        if (selectedWord && selectedWord.word === word) {
            selectedWord = null; // Deselect if the same word is clicked again
        } else {
            selectedWord = word; // Select the word and its details
        }
    }

    // Scroll to the selected letter in the UI
    function scrollToLetter(letter) {
        // Wait for the DOM update to ensure the elements are rendered
        setTimeout(() => {
            const letterElement = document.getElementById(`letter-${letter}`);
            if (letterElement) {
                letterElement.scrollIntoView({ behavior: 'smooth' });
            }
        }, 100); // Small delay to ensure DOM is updated before scrolling
    }

    function handleLetterChange(letter) {
        selectedLetter = letter;
        if (selectedLanguage === reversalLanguage) {
            fetchReversalWords();
        }
        else if (selectedLanguage === vernacularLanguage) {
            queryVernacularWords();
        }
    }

    function switchLanguage(language) {
        //reversalWordsList = [];
        selectedLanguage = language;
        //loadedReversalLetters = new Set();
        if (selectedLanguage === reversalLanguage) {
            selectedLetter = currentAlphabet[0];
            fetchReversalWords();
        }
        else if (selectedLanguage === vernacularLanguage) {
            selectedLetter = currentAlphabet[0];
            queryVernacularWords();
        }
    }

    // Function to check if we've scrolled to the bottom
    function checkIfScrolledToBottom(event) {
        const div = event.target;
        if (div.scrollHeight - div.scrollTop === div.clientHeight) {
            // INSTEAD OF Z, DETERMINE IF THERE IS A NEXT LETTER
            if (selectedLetter !== 'z') {
                // Increment the current letter to the next letter
                selectedLetter = String.fromCharCode(selectedLetter.charCodeAt(0) + 1);
                if (selectedLanguage === reversalLanguage) {
                    fetchReversalWords();
                }
                else if (selectedLanguage === vernacularLanguage) {
                    queryVernacularWords();
                }
            }
        }

        if (loadedReversalLetters.has(selectedLetter)) {
            // Iterate over all letter divs to find the one currently visible in the viewport
            const allLetters = div.querySelectorAll('[id^="letter-"]');  // Select all divs with id starting with 'letter-'
            
            let visibleLetter = null;
            allLetters.forEach(letterDiv => {
                const rect = letterDiv.getBoundingClientRect();

                // If the letter div is fully within the viewport, set it as the current visible letter
                if (rect.top >= 0 && rect.bottom <= window.innerHeight) {
                    visibleLetter = letterDiv.id.split('-')[1];  // Extract the letter number from the id (e.g., 'letter-1' -> '1')
                }
            });

            if (visibleLetter) {
                selectedLetter = visibleLetter;  // Update selectedLetter to the currently visible letter
            }
        }
    }

    // Reactive to get the current alphabet based on selected language
    $: currentAlphabet = selectedLanguage === reversalLanguage ? alphabets.reversal : alphabets.vernacular;

    onMount(() => {
        queryVernacularWords();
        if (config.programType !== 'DAB') {
            goto(`${base}/text`);
        }
    });
</script>

<Navbar>
    {#snippet center()}
    <label for="sidebar" class="navbar">
        <div class="btn btn-ghost normal-case text-xl text-white font-bold">
            {dictionaryName}
        </div>
    </label>
    {/snippet}
</Navbar>

<div class="flex flex-col">
    {#if !selectedWord}
        <LexiconReversalView
            alphabet={currentAlphabet}
            {selectedLanguage}
            {vernacularLanguage}
            {reversalLanguage}
            {selectedLetter}
            onSwitchLanguage={switchLanguage}
            onLetterChange={handleLetterChange}
        />
    {:else}
        <LexiconXmlView/>
    {/if}
</div>

<div class="p-4 max-h-96 overflow-y-auto" on:scroll={checkIfScrolledToBottom}>
    {#if selectedWord}
        <!-- Display selected word and its index -->
        <div>
            <p class="text-xl font-bold">{selectedWord.word}</p>
            <p class="text-md mt-2">{selectedWord.index}</p>
        </div>
    {:else}
        <!-- List of words -->
        <ul class="space-y-4">
            {#if selectedLanguage === vernacularLanguage}
                {#each vernacularWordsList as { id, name, homonym_index, type, num_senses, summary }}
                    <li class="cursor-pointer text-lg" id="letter-{name[0].toLowerCase()}">
                        <div on:click={() => selectWord({ word: name, index: id })}>
                            <p class="font-bold">{name}</p>
                        </div>
                    </li>
                {/each}
            {:else}
                {#each reversalWordsList as { word, index, letter }}
                    <!-- Dynamically create an ID using the correct letter for the word -->
                    <li class="cursor-pointer text-lg" id="letter-{word[0].toLowerCase()}">
                        <div on:click={() => selectWord({ word, index })}>
                            <p class="font-bold">{word}</p>
                            <p class="text-md ml-4">{index}</p>
                            <!-- Indented, unbolded index -->
                        </div>
                    </li>
                {/each}
            {/if}
        </ul>
    {/if}
</div>