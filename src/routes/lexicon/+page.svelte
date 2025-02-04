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
        reversal: [
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
    let REVERSAL_LANG = 'English';

    // Function to fetch words for selected letter with lazy loading
    async function fetchReversalWords() {
        if (selectedLanguage === REVERSAL_LANG) {
            let fileIndex = 1;
            let moreFiles = true;

            // Fetch words for the selected letter if not already loaded
            if (!loadedLetters.has(selectedLetter)) {
                // Avoid resetting the list on every fetch
                let newWords = [];

                // Backfill for previous letters
                const letterIndex = alphabets.reversal.indexOf(selectedLetter);
                for (let i = 0; i < letterIndex; i++) {
                    if (!loadedLetters.has(alphabets.reversal[i])) {
                        await loadLetterData(alphabets.reversal[i]);
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
        fetchReversalWords();
        if (config.programType !== 'DAB') {
            goto(`${base}/text`);
        }
    });

    let selectedLanguage = REVERSAL_LANG;
    let reversalLang = reversalLanguage;

    function handleLetterChange(letter) {
        selectedLetter = letter;
        fetchReversalWords();
    }

    function switchLanguage(language) {
        wordsList = [];
        selectedLanguage = language;
        loadedLetters = new Set();
        if (selectedLanguage === REVERSAL_LANG) {
            selectedLetter = currentAlphabet[0];
            fetchReversalWords();
        }
    }

    // Function to check if we've scrolled to the bottom
    function checkIfScrolledToBottom(event) {
        const div = event.target;
        if (div.scrollHeight - div.scrollTop === div.clientHeight) {
            if (selectedLetter !== 'z') {
                // Increment the current letter to the next letter
                selectedLetter = String.fromCharCode(selectedLetter.charCodeAt(0) + 1);
                fetchReversalWords();
            }
        }

        if (loadedLetters.has(selectedLetter)) {
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
    $: currentAlphabet = selectedLanguage === REVERSAL_LANG ? alphabets.reversal : alphabets.hanga;
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
            {selectedLetter}
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
                <li class="cursor-pointer text-lg" id="letter-{word[0].toLowerCase()}">
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