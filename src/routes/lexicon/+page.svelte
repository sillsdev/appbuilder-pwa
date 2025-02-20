<script>
    import { goto } from '$app/navigation';
    import { base } from '$app/paths';
    import { page } from '$app/state';
    import LexiconReversalView from '$lib/components/LexiconReversalView.svelte';
    import LexiconXmlView from '$lib/components/LexiconXMLView.svelte';
    import Navbar from '$lib/components/Navbar.svelte';
    import config from '$lib/data/config';
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

    let selectedLetter = 'a';
    let wordsList = [];
    let selectedWord = null;
    let defaultReversalKey = Object.keys(reversalAlphabets[0])[0];
    let loadedLetters = new Set();
    let reversalLanguage = Object.values(reversalLanguages[0])[0];
    let selectedLanguage = reversalLanguage;

    async function fetchReversalWords() {
        if (selectedLanguage === reversalLanguage) {
            let fileIndex = 1;
            let moreFiles = true;

            if (!loadedLetters.has(selectedLetter)) {
                let newWords = [];

                const letterIndex = alphabets.reversal.indexOf(selectedLetter);
                for (let i = 0; i < letterIndex; i++) {
                    if (!loadedLetters.has(alphabets.reversal[i])) {
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
                    }
                }

                wordsList = [...wordsList, ...newWords];

                loadedLetters.add(selectedLetter);
            }
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

    function checkIfScrolledToBottom(event) {
        const div = event.target;
        if (div.scrollHeight - div.scrollTop === div.clientHeight) {
            if (selectedLetter !== 'z') {
                selectedLetter = String.fromCharCode(selectedLetter.charCodeAt(0) + 1);
                fetchReversalWords();
            }
        }

        if (loadedLetters.has(selectedLetter)) {
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
        fetchReversalWords();
        if (config.programType !== 'DAB') {
            goto(`${base}/text`);
        }
    });
</script>

<!-- This is now set to full height of viewport instead of a set one -->
<div class="flex flex-col h-screen">
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

    <!-- This will now flex-grow and fill whatever remaining space exists-->
    <div class="flex-grow overflow-y-auto p-4" on:scroll={checkIfScrolledToBottom}>
        {#if selectedWord}
            <div>
                <p class="text-xl font-bold break-words">{selectedWord.word}</p>
                <p class="text-md mt-2">{selectedWord.index}</p>
            </div>
        {:else}
            <ul class="space-y-2">
                {#each wordsList as { word, index, letter }}
                    <li class="cursor-pointer text-lg" id="letter-{word[0].toLowerCase()}">
                        <div on:click={() => selectWord({ word, index })}>
                            <p class="font-bold break-words">{word}</p>
                            <p class="text-md ml-4">{index}</p>
                        </div>
                    </li>
                {/each}
            </ul>
        {/if}
    </div>
</div>
