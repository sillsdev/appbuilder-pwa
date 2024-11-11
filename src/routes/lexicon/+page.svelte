<<<<<<< HEAD
<script lang="ts">
    import { page } from '$app/stores';
    import Navbar from '$lib/components/Navbar.svelte';
    import config from '$lib/data/config';

    const { entries } = $page.data;
</script>

<div class="grid grid-rows-[auto,1fr]" style="height:100vh;height:100dvh;">
    <div class="navbar">
        <Navbar showBackButton={false}>
            <!-- <div slot="left-buttons" /> -->
            <label for="sidebar" slot="center">
                <div class="btn btn-ghost normal-case text-xl">{config.name}</div>
            </label>
            <!-- <div slot="right-buttons" /> -->
        </Navbar>
    </div>
    <div class="overflow-y-auto max-w-screen-md">
        <div id="container" class="lexicon">
            <ul>
                {#if entries.length > 0}
                    {#each entries as entry}
                        <li>{entry.name}</li>
                    {/each}
                {:else}
                    <li>No entries available or table 'entries' not found.</li>
                {/if}
            </ul>
        </div>
    </div>
</div>
=======
<script>
    import { goto } from '$app/navigation';
    import { base } from '$app/paths';
    import { page } from '$app/state';
    import LexiconReversalView from '$lib/components/LexiconReversalView.svelte';
    import LexiconXmlView from '$lib/components/LexiconXMLView.svelte';
    import Navbar from '$lib/components/Navbar.svelte';
    import config from '$lib/data/config';
    import { onMount } from 'svelte';

    const {fetch, vernacularAlphabet, vernacularLanguage, reversalAlphabets, reversalLanguages, dictionaryName} = page.data;

    const alphabets = {
        reversal: Object.values(reversalAlphabets[0])[0],
        vernacular: vernacularAlphabet
    };

    let selectedLetter = 'a';
    let wordsList = [];
    let selectedWord = null;
    let defaultReversalKey = Object.keys(reversalAlphabets[0])[0];
    let loadedLetters = new Set();
    let reversalLanguage = Object.values(reversalLanguages[0])[0];
    let selectedLanguage = reversalLanguage;

    // Function to fetch words for selected letter with lazy loading
    async function fetchReversalWords() {
        if (selectedLanguage === reversalLanguage) {
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

    function handleLetterChange(letter) {
        selectedLetter = letter;
        fetchReversalWords();
    }

    function switchLanguage(language) {
        wordsList = [];
        selectedLanguage = language;
        loadedLetters = new Set();
        if (selectedLanguage === reversalLanguage) {
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
    $: currentAlphabet = selectedLanguage === reversalLanguage ? alphabets.reversal : alphabets.vernacular;

    onMount(() => {
        fetchReversalWords();
        if (config.programType !== 'DAB') {
            goto(`${base}/text`);
        }
    });
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
>>>>>>> 8041142 (Create route for lexicon page)
