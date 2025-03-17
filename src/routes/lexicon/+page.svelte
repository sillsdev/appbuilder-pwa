<script>
    import { goto } from '$app/navigation';
    import { base } from '$app/paths';
    import { page } from '$app/state';
    import LexiconReversalListView from '$lib/components/LexiconReversalListView.svelte';
    import LexiconReversalView from '$lib/components/LexiconReversalView.svelte';
    import LexiconXmlView from '$lib/components/LexiconXMLView.svelte';
    import Navbar from '$lib/components/Navbar.svelte';
    import WordNavigationStrip from '$lib/components/WordNavigationStrip.svelte';
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
    let loadedReversalLetters = new Set();
    let reversalWordsList = [];
    let vernacularWordsList = [];
    let selectedLanguage = sessionStorage.getItem('selectedLanguage') || vernacularLanguage;
    const reversalLanguage = Object.values(reversalLanguages[0])[0];

    async function fetchVernacularWords() {
        if (vernacularWordsList.length === 0) {
            const storedWords = sessionStorage.getItem('vernacularWordsList');
            if (storedWords) {
                vernacularWordsList = JSON.parse(storedWords);
                return;
            }

            const SQL = await initSqlJs({
                locateFile: (file) => `${base}/wasm/sql-wasm.wasm`
            });

            const response = await fetch(`${base}/data.sqlite`);
            const buffer = await response.arrayBuffer();
            const db = new SQL.Database(new Uint8Array(buffer));

            const results = db.exec(
                `SELECT id, name, homonym_index, type, num_senses, summary FROM entries`
            );

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
        }
    }

    async function fetchReversalWords() {
        if (selectedLanguage === reversalLanguage && !loadedReversalLetters.has(selectedLetter)) {
            console.log('Loading letter data:', selectedLetter);
            fetchVernacularWords(); // Reloading from store

            let fileIndex = 1;
            let moreFiles = true;
            let newWords = [];

            const letterIndex = alphabets.reversal.indexOf(selectedLetter);
            for (let i = 0; i < letterIndex; i++) {
                if (!loadedReversalLetters.has(alphabets.reversal[i])) {
                    console.log('Loading letter data first for loop:', alphabets.reversal[i]);
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
                        const currentFileWords = Object.entries(data).map(([word, entries]) => {
                            return {
                                word: word,
                                indexes: entries.map((entry) => entry.index),
                                letter: selectedLetter
                            };
                        });

                        currentFileWords.forEach((newWord) => {
                            const existingWord = newWords.find((w) => w.word === newWord.word);
                            if (existingWord) {
                                existingWord.indexes = [
                                    ...new Set([...existingWord.indexes, ...newWord.indexes])
                                ];
                            } else {
                                newWords.push(newWord);
                            }
                        });

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
        }
    }

    async function loadLetterData(letter) {
        let fileIndex = 1;
        let moreFiles = true;
        let newWords = [];

        while (moreFiles) {
            try {
                const response = await fetch(
                    `${base}/reversal/${defaultReversalKey}/${letter}-${String(fileIndex).padStart(3, '0')}.json`
                );
                if (response.ok) {
                    const data = await response.json();
                    const currentFileWords = Object.entries(data).map(([word, entries]) => {
                        return {
                            word: word,
                            indexes: entries.map((entry) => entry.index),
                            letter: letter
                        };
                    });

                    currentFileWords.forEach((newWord) => {
                        const existingWord = newWords.find((w) => w.word === newWord.word);
                        if (existingWord) {
                            existingWord.indexes = [
                                ...new Set([...existingWord.indexes, ...newWord.indexes])
                            ];
                        } else {
                            newWords.push(newWord);
                        }
                    });

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
        loadedReversalLetters.add(letter);
    }

    function selectWord(word) {
        selectedWord = selectedWord && selectedWord.word === word ? null : word;
    }

    function scrollToLetter(letter) {
        setTimeout(() => {
            const letterElement = document.getElementById(`letter-${letter}`);
            if (letterElement) {
                letterElement.scrollIntoView({ behavior: 'smooth' });
            }
        }, 100);
    }

    async function handleLetterChange(letter) {
        selectedLetter = letter;
        if (selectedLanguage === reversalLanguage) {
            await fetchReversalWords();
        }
        scrollToLetter(letter);
    }

    function switchLanguage(language) {
        sessionStorage.setItem('selectedLanguage', language);
        reversalWordsList = [];
        selectedLanguage = language;
        loadedReversalLetters = new Set();
        selectedLetter = currentAlphabet[0];
        if (selectedLanguage === reversalLanguage) {
            fetchReversalWords();
        } else {
            fetchVernacularWords();
            const scrollableDiv = document.querySelector('.flex-1.overflow-y-auto.bg-base-100');
            if (scrollableDiv) {
                scrollableDiv.scrollTop = 0;
            }
        }
    }

    function checkIfScrolledToBottom(event) {
        if (
            (selectedLanguage === reversalLanguage && reversalWordsList.length > 0) ||
            (selectedLanguage === vernacularLanguage && vernacularWordsList.length > 0)
        ) {
            let div = event.target;

            if (div.scrollHeight - div.scrollTop === div.clientHeight) {
                const currentIndex = currentAlphabet.indexOf(selectedLetter);
                if (currentIndex < currentAlphabet.length - 1) {
                    selectedLetter = currentAlphabet[currentIndex + 1];
                    if (selectedLanguage === reversalLanguage) {
                        fetchReversalWords();
                    } else {
                        fetchVernacularWords();
                    }
                }
            }
            else if (
                (selectedLanguage === reversalLanguage && loadedReversalLetters.has(selectedLetter)) ||
                (selectedLanguage === vernacularLanguage) 
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
    }

    $: currentAlphabet =
        selectedLanguage === reversalLanguage ? alphabets.reversal : alphabets.vernacular;

    window.addEventListener('beforeunload', () => {
        sessionStorage.removeItem('selectedLanguage');
        sessionStorage.removeItem('vernacularWordsList');
    });

    onMount(() => {
        if (selectedLetter) {
            if (selectedLanguage === reversalLanguage) {
                fetchReversalWords();
            } else {
                fetchVernacularWords();
            }
        }
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
        {/if}
    </div>

    <div class="flex-1 overflow-y-auto bg-base-100" on:scroll={checkIfScrolledToBottom}>
        {#if selectedWord}
            <div class="sticky top-0 z-10">
                <WordNavigationStrip
                    currentWord={selectedWord}
                    wordsList={selectedLanguage === vernacularLanguage
                        ? vernacularWordsList
                        : reversalWordsList}
                    onSelectWord={selectWord}
                />
            </div>
            <div class="p-4">
                <LexiconXmlView {selectedWord} />
            </div>
        {:else}
            <div class="p-4">
                <LexiconReversalListView
                    {selectedLanguage}
                    {vernacularLanguage}
                    {vernacularWordsList}
                    {reversalWordsList}
                    {selectWord}
                />
            </div>
        {/if}
    </div>
</div>
