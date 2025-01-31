<script>
    import { goto } from '$app/navigation';
    import { base } from '$app/paths';
    import { page } from '$app/stores';
    import LexiconReversalView from '$lib/components/LexiconReversalView.svelte';
    import LexiconXmlView from '$lib/components/LexiconXMLView.svelte';
    import Navbar from '$lib/components/Navbar.svelte';
    import config from '$lib/data/config';
    import { t } from '$lib/data/stores';
    import { onMount } from 'svelte';

    const { fetch, alphabet, initialReversalData, reversalLanguage, dictionaryName } = $page.data;

    const alphabets = {
        english: [
            'a',
            'b',
            'c',
            'd',
            'e',
            'f',
            'g',
            'h',
            'i',
            'j',
            'k',
            'l',
            'm',
            'n',
            'o',
            'p',
            'q',
            'r',
            's',
            't',
            'u',
            'v',
            'w',
            'x',
            'y',
            'z'
        ],
        hanga: alphabet // Use the loaded Hanga alphabet
    };

    let selectedLetter = 'a'; // Example: user selects 'a'
    let wordsList = [];
    let selectedWord = null;
    let defaultKey = 'en';
    let loadedLetters = new Set();

    // Function to fetch words for selected letter with lazy loading
    async function fetchEnglishWords() {
        if (selectedLanguage === 'English') {
            let fileIndex = 1;
            let moreFiles = true;

            // Fetch words for the selected letter if not already loaded
            if (!loadedLetters.has(selectedLetter)) {
                // Avoid resetting the list on every fetch
                let newWords = [];

                // Backfill for previous letters
                const letterIndex = alphabets.english.indexOf(selectedLetter);
                for (let i = 0; i < letterIndex; i++) {
                    if (!loadedLetters.has(alphabets.english[i])) {
                        await loadLetterData(alphabets.english[i]);
                    }
                }

                // Fetch data for the selected letter
                while (moreFiles) {
                    try {
                        const response = await fetch(
                            `${base}/reversal/${defaultKey}/${selectedLetter}-${String(fileIndex).padStart(3, '0')}.json`
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
                wordsList = [...wordsList, ...newWords];

                // Mark the letter as loaded
                loadedLetters.add(selectedLetter);
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
                    `${base}/reversal/${defaultKey}/${letter}-${String(fileIndex).padStart(3, '0')}.json`
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
                    wordsList = [...wordsList, ...currentFileWords];
                    fileIndex++;
                } else {
                    moreFiles = false;
                }
            } catch (error) {
                console.error('Error loading word data:', error);
            }
        }

        loadedLetters.add(letter);
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

    onMount(() => {
        fetchEnglishWords();
        if (config.programType !== 'DAB') {
            goto(`${base}/text`);
        }
    });

    let selectedLanguage = 'English';
    let reversalLang = reversalLanguage;

    function handleLetterChange(letter) {
        selectedLetter = letter;
        fetchEnglishWords();
    }

    function switchLanguage(language) {
        wordsList = [];
        selectedLanguage = language;
        loadedLetters = new Set();
        if (selectedLanguage === 'English') {
            selectedLetter = currentAlphabet[0];
            fetchEnglishWords();
        }
    }

    // Function to check if we've scrolled to the bottom
    function checkIfScrolledToBottom(event) {
        const div = event.target;
        if (div.scrollHeight - div.scrollTop === div.clientHeight) {
            if (selectedLetter !== 'z') {
                // Increment the current letter to the next letter
                selectedLetter = String.fromCharCode(selectedLetter.charCodeAt(0) + 1);
                fetchEnglishWords();
            }
        }
    }

    // Reactive to get the current alphabet based on selected language
    $: currentAlphabet = selectedLanguage === 'English' ? alphabets.english : alphabets.hanga;
</script>

<Navbar>
    <label for="sidebar" slot="center" class="navbar">
        <div class="btn btn-ghost normal-case text-xl text-white font-bold">
            {dictionaryName}
        </div>
    </label>
</Navbar>

<div class="flex flex-col">
    {#if !selectedWord}
        <LexiconReversalView
            alphabet={currentAlphabet}
            {initialReversalData}
            {selectedLanguage}
            {reversalLang}
            onSwitchLanguage={switchLanguage}
            onLetterChange={handleLetterChange}
        />
    {:else}
        <LexiconXmlView {initialReversalData} />
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
            {#each wordsList as { word, index, letter }}
                <!-- Dynamically create an ID using the correct letter for the word -->
                <li class="cursor-pointer text-lg" id="letter-{word[0]}">
                    <div on:click={() => selectWord({ word, index })}>
                        <p class="font-bold">{word}</p>
                        <p class="text-md ml-4">{index}</p>
                        <!-- Indented, unbolded index -->
                    </div>
                </li>
            {/each}
        </ul>
    {/if}
</div>