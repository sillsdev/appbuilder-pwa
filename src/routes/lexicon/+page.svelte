<script>
    import { goto } from '$app/navigation';
    import { base } from '$app/paths';
    import { page } from '$app/state';
    import LexiconEntryView from '$lib/components/LexiconEntryView.svelte';
    import LexiconListViewHeader from '$lib/components/LexiconListViewHeader.svelte';
    import LexiconReversalListView from '$lib/components/LexiconReversalListView.svelte';
    import LexiconVernacularListView from '$lib/components/LexiconVernacularListView.svelte';
    import Navbar from '$lib/components/Navbar.svelte';
    import WordNavigationStrip from '$lib/components/WordNavigationStrip.svelte';
    import config from '$lib/data/config';
    import {
        currentReversalLettersStore,
        currentReversalWordsStore,
        reversalLettersStore,
        reversalWordsStore,
        selectedReversalLanguageStore,
        vernacularWordsStore
    } from '$lib/data/stores/lexicon.ts';
    import { onMount, tick } from 'svelte';

    const {
        vernacularAlphabet,
        vernacularLanguage,
        reversalAlphabets,
        reversalLanguages,
        reversalIndexes,
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
    let reversalWordsList;
    let vernacularWordsList;
    let selectedLanguage = vernacularLanguage;
    let scrollContainer;

    // Subscribe to stores
    currentReversalLettersStore.subscribe((value) => (loadedReversalLetters = new Set(value)));
    currentReversalWordsStore.subscribe((value) => (reversalWordsList = value));
    vernacularWordsStore.subscribe((value) => (vernacularWordsList = value));
    selectedReversalLanguageStore.subscribe((value) => {
        selectedLanguage = value || vernacularLanguage;
    });
    const reversalLanguage = Object.values(reversalLanguages[0])[0];

    async function fetchWords(letter = selectedLetter) {
        if (selectedLanguage === reversalLanguage && !loadedReversalLetters.has(letter)) {
            console.log('Loading letter data:', letter);

            const letterIndex = alphabets.reversal.indexOf(letter);
            const lettersToLoad = alphabets.reversal
                .slice(0, letterIndex)
                .filter((l) => !loadedReversalLetters.has(l));

            // Load all required letters in parallel
            await Promise.all(lettersToLoad.map(loadLetterData));

            // Load the current letter
            await loadLetterData(letter);

            // Sort the results based on the selectedLanguage's alphabet
            reversalWordsStore.update((words) => {
                const updatedWords = { ...words };
                updatedWords[selectedLanguage] = (updatedWords[selectedLanguage] || []).sort(
                    (a, b) => {
                        const alphabet = currentAlphabet;
                        return (
                            alphabet.indexOf(a.word[0].toLowerCase()) -
                            alphabet.indexOf(b.word[0].toLowerCase())
                        );
                    }
                );
                return updatedWords;
            });
        }
    }

    async function loadLetterData(letter) {
        let newWords = [];

        const index = reversalIndexes[defaultReversalKey];
        const files = index[letter] || [];
        for (const file of files) {
            const reversalFile = `${base}/reversal/${defaultReversalKey}/${file}`;
            const response = await fetch(reversalFile);
            if (response.ok) {
                const data = await response.json();
                const currentFileWords = Object.entries(data).map(([word, entries]) => {
                    return {
                        word: word,
                        indexes: entries.map((entry) => entry.index),
                        vernacularWords: entries
                            .map((entry) => {
                                const foundWord = vernacularWordsList.find(
                                    (vw) => vw.id === entry.index
                                );
                                if (foundWord) {
                                    return {
                                        name: foundWord.name,
                                        homonymIndex: foundWord.homonym_index || 0
                                    };
                                } else {
                                    console.log(
                                        `Index ${entry.index} not found in vernacularWordsList`
                                    );
                                    return null; // Return null for missing indexes
                                }
                            })
                            .filter((index) => index !== null), // Filter out null values
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
            }
        }

        reversalWordsStore.update((words) => {
            const updatedWords = { ...words };
            updatedWords[selectedLanguage] = [
                ...(updatedWords[selectedLanguage] || []),
                ...newWords
            ];
            return updatedWords;
        });

        reversalLettersStore.update((letters) => {
            const updatedLetters = { ...letters };
            updatedLetters[selectedLanguage] = [
                ...(updatedLetters[selectedLanguage] || []),
                letter
            ];
            return updatedLetters;
        });
    }

    function selectWord(word) {
        selectedWord = selectedWord && selectedWord.word === word ? null : word;
    }

    async function scrollToLetter(letter) {
        await tick();
        const target = document.getElementById(`letter-${letter}`);
        if (target && scrollContainer) {
            const containerTop = scrollContainer.getBoundingClientRect().top;
            const targetTop = target.getBoundingClientRect().top;
            const offset = targetTop - containerTop + scrollContainer.scrollTop;

            scrollContainer.scrollTo({
                top: offset,
                behavior: 'smooth'
            });
        }
    }

    async function handleLetterChange(letter) {
        selectedLetter = letter;
        if (selectedLanguage === reversalLanguage) {
            await fetchWords();
        }
        scrollToLetter(letter);
    }

    function switchLanguage(language) {
        selectedReversalLanguageStore.set(language);
        selectedLanguage = language;
        selectedLetter = currentAlphabet[0];
        if (selectedLanguage != vernacularLanguage) {
            fetchWords();
        }
        const scrollableDiv = document.querySelector('.flex-1.overflow-y-auto.bg-base-100');
        if (scrollableDiv) {
            scrollableDiv.scrollTop = 0;
        }
    }

    let isFetching = false;

    async function checkIfScrolledToBottom(event) {
        if (isFetching) return;

        if (
            (selectedLanguage === reversalLanguage && reversalWordsList.length > 0) ||
            (selectedLanguage === vernacularLanguage && vernacularWordsList.length > 0)
        ) {
            let div = event.target;
            const threshold = 100;

            if (div.scrollHeight - div.scrollTop - div.clientHeight < threshold) {
                const currentIndex = currentAlphabet.indexOf(selectedLetter);
                if (!loadedReversalLetters.has(currentAlphabet[currentIndex + 1])) {
                    if (currentIndex < currentAlphabet.length - 1) {
                        isFetching = true;
                        await fetchWords(currentAlphabet[currentIndex + 1]);
                        isFetching = false;
                    }
                }
            } else if (
                (selectedLanguage === reversalLanguage &&
                    loadedReversalLetters.has(selectedLetter)) ||
                selectedLanguage === vernacularLanguage
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

    onMount(() => {
        if (selectedLetter && selectedLanguage != vernacularLanguage) {
            fetchWords();
        }
        if (config.programType !== 'DAB') {
            goto(`${base}/text`);
        }
    });
</script>

<div class="grid grid-rows-[auto,1fr] bg-base-100" style="height:100vh;height:100dvh;">
    <!--<div class="flex flex-col min-h-screen max-h-screen bg-base-100">-->
    <Navbar>
        {#snippet center()}
            <label for="sidebar" class="navbar">
                <div class="btn btn-ghost normal-case text-xl text-white font-bold">
                    {dictionaryName}
                </div>
            </label>
        {/snippet}
    </Navbar>

    {#if !selectedWord}
        <LexiconListViewHeader
            alphabet={currentAlphabet}
            {selectedLanguage}
            {vernacularLanguage}
            {reversalLanguage}
            {selectedLetter}
            onSwitchLanguage={switchLanguage}
            onLetterChange={handleLetterChange}
        />
    {/if}

    <div
        class="flex-1 overflow-y-auto bg-base-100"
        bind:this={scrollContainer}
        on:scroll={checkIfScrolledToBottom}
    >
        {#if selectedWord}
            <WordNavigationStrip
                currentWord={selectedWord}
                wordsList={selectedLanguage === vernacularLanguage
                    ? vernacularWordsList
                    : reversalWordsList}
                onSelectWord={selectWord}
            />
            <LexiconEntryView
                {selectedWord}
                {vernacularWordsList}
                {vernacularLanguage}
                onSwitchLanguage={switchLanguage}
                onSelectWord={selectWord}
            />
        {:else if selectedLanguage === vernacularLanguage}
            <LexiconVernacularListView {vernacularWordsList} onSelectWord={selectWord} />
        {:else}
            <LexiconReversalListView {reversalWordsList} onSelectWord={selectWord} />
        {/if}
    </div>
</div>
