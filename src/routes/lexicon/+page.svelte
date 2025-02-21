<script>
    import { goto } from '$app/navigation';
    import { base } from '$app/paths';
    import { page } from '$app/state';
    import LexiconReversalView from '$lib/components/LexiconReversalView.svelte';
    import LexiconXmlView from '$lib/components/LexiconXMLView.svelte';
    import Navbar from '$lib/components/Navbar.svelte';
    import config from '$lib/data/config';
    import initSqlJs from 'sql.js';
    import { onMount } from 'svelte';

    const {
        fetch,
        vernacularAlphabet,
        vernacularLanguage,
        reversalAlphabets,
        reversalLanguages,
        dictionaryName
    } = page.data;

    const alphabets = {
        reversal: Object.values(reversalAlphabets[0])[0],
        vernacular: vernacularAlphabet
    };

    let selectedLetter = alphabets.vernacular[0];
    let selectedWord = null;
    let defaultReversalKey = Object.keys(reversalAlphabets[0])[0];
    let loadedVernacularLetters = new Set();
    let loadedReversalLetters = new Set();
    let reversalWordsList = [];
    let vernacularWordsList = [];
    let selectedLanguage = vernacularLanguage;
    const reversalLanguage = Object.values(reversalLanguages[0])[0];

    async function queryVernacularWords() {
        if (
            selectedLanguage === vernacularLanguage &&
            !loadedVernacularLetters.has(selectedLetter)
        ) {
            const SQL = await initSqlJs({
                locateFile: (file) => `${base}/wasm/sql-wasm.wasm`
            });

            const response = await fetch(`${base}/data.sqlite`);
            const buffer = await response.arrayBuffer();
            const db = new SQL.Database(new Uint8Array(buffer));

            const letterIndex = alphabets.vernacular.indexOf(selectedLetter);
            for (let i = 0; i <= letterIndex; i++) {
                if (!loadedVernacularLetters.has(alphabets.vernacular[i])) {
                    const results = db.exec(
                        `SELECT id, name, homonym_index, type, num_senses, summary FROM entries WHERE REPLACE(name, '-', '') LIKE "${alphabets.vernacular[i]}%"`
                    );

                    if (results[0]) {
                        const entries = results[0].values.map((value) => {
                            const entry = {};
                            for (let i = 0; i < results[0].columns.length; ++i) {
                                entry[results[0].columns[i]] = value[i];
                            }

                            entry.letter = alphabets.vernacular[i];
                            return entry;
                        });

                        vernacularWordsList = [...vernacularWordsList, ...entries];
                        loadedVernacularLetters.add(alphabets.vernacular[i]);
                    }
                }
            }
            scrollToLetter(selectedLetter);
        }
    }

    async function fetchReversalWords() {
        if (selectedLanguage === reversalLanguage && !loadedReversalLetters.has(selectedLetter)) {
            let fileIndex = 1;
            let moreFiles = true;
            let newWords = [];

            const letterIndex = alphabets.reversal.indexOf(selectedLetter);
            for (let i = 0; i < letterIndex; i++) {
                if (!loadedReversalLetters.has(alphabets.reversal[i])) {
                    await loadLetterData(alphabets.reversal[i]);
                }
            }

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
                                    letter: selectedLetter
                                }));
                            })
                            .flat();
                        newWords = [...newWords, ...currentFileWords];
                        fileIndex++;
                    } else {
                        moreFiles = false;
                    }
                } catch (error) {
                    console.error('Error loading word data:', error);
                    moreFiles = false;
                }
            }

            reversalWordsList = [...reversalWordsList, ...newWords];
            loadedReversalLetters.add(selectedLetter);
            scrollToLetter(selectedLetter);
        }
    }

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
                                index: entry.index,
                                letter
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
                moreFiles = false;
            }
        }

        loadedReversalLetters.add(letter);
    }

    function selectWord(word) {
        if (selectedWord && selectedWord.word === word) {
            selectedWord = null;
        } else {
            selectedWord = word;
        }
    }

    function scrollToLetter(letter) {
        setTimeout(() => {
            const letterElement = document.getElementById(`letter-${letter}`);
            if (letterElement) {
                letterElement.scrollIntoView({ behavior: 'smooth' });
            }
        }, 100);
    }

    function handleLetterChange(letter) {
        selectedLetter = letter;
        if (selectedLanguage === reversalLanguage) {
            fetchReversalWords();
        } else {
            queryVernacularWords();
        }
    }

    function switchLanguage(language) {
        reversalWordsList = [];
        vernacularWordsList = [];
        selectedLanguage = language;
        loadedReversalLetters = new Set();
        loadedVernacularLetters = new Set();
        selectedLetter = currentAlphabet[0];
        if (selectedLanguage === reversalLanguage) {
            fetchReversalWords();
        } else {
            queryVernacularWords();
        }
    }

    function checkIfScrolledToBottom(event) {
        const div = event.target;
        const threshold = 50;

        if (div.scrollHeight - div.scrollTop - div.clientHeight < threshold) {
            const currentIndex = currentAlphabet.indexOf(selectedLetter);
            if (currentIndex < currentAlphabet.length - 1) {
                selectedLetter = currentAlphabet[currentIndex + 1];
                if (selectedLanguage === reversalLanguage) {
                    fetchReversalWords();
                } else {
                    queryVernacularWords();
                }
            }
        }

        if (
            loadedReversalLetters.has(selectedLetter) ||
            loadedVernacularLetters.has(selectedLetter)
        ) {
            const allLetters = div.querySelectorAll('[id^="letter-"]');
            let visibleLetter = null;

            allLetters.forEach((letterDiv) => {
                const rect = letterDiv.getBoundingClientRect();
                if (rect.top >= 0 && rect.bottom <= window.innerHeight) {
                    visibleLetter = letterDiv.id.split('-')[1];
                }
            });

            if (visibleLetter) {
                selectedLetter = visibleLetter;
            }
        }
    }

    $: currentAlphabet =
        selectedLanguage === reversalLanguage ? alphabets.reversal : alphabets.vernacular;

    onMount(() => {
        queryVernacularWords();
        if (config.programType !== 'DAB') {
            goto(`${base}/text`);
        }
    });
</script>

<div class="flex flex-col min-h-screen max-h-screen bg-base-100">
    <Navbar>
        {#snippet center()}
            <label for="sidebar" class="navbar">
                <div class="btn btn-ghost normal-case text-xl text-white font-bold">
                    {dictionaryName}
                </div>
            </label>
        {/snippet}
    </Navbar>

    <div class="flex-none">
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
            <LexiconXmlView />
        {/if}
    </div>

    <div class="flex-1 overflow-y-auto p-4 bg-base-100" on:scroll={checkIfScrolledToBottom}>
        {#if selectedWord}
            <div>
                <p class="text-xl font-bold break-words">{selectedWord.word}</p>
                <p class="text-md mt-2">{selectedWord.index}</p>
            </div>
        {:else}
            <ul class="space-y-2">
                {#if selectedLanguage === vernacularLanguage}
                    {#each vernacularWordsList as { id, name, homonym_index, type, num_senses, summary, letter }}
                        <li class="cursor-pointer text-lg" id="letter-{letter}">
                            <div on:click={() => selectWord({ word: name, index: id })}>
                                <p class="font-bold break-words">{name}</p>
                            </div>
                        </li>
                    {/each}
                {:else}
                    {#each reversalWordsList as { word, index, letter }}
                        <li class="cursor-pointer text-lg" id="letter-{letter}">
                            <div on:click={() => selectWord({ word, index })}>
                                <p class="font-bold break-words">{word}</p>
                                <p class="text-md ml-4">{index}</p>
                            </div>
                        </li>
                    {/each}
                {/if}
            </ul>
        {/if}
    </div>
</div>
