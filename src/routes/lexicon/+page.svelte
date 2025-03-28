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

    async function fetchWords(letter = selectedLetter) {
        if (vernacularWordsList.length === 0) {
            const storedWords = sessionStorage.getItem('vernacularWordsList');
            if (storedWords) {
                vernacularWordsList = JSON.parse(storedWords);
            }
            else {
                console.error('Error loading vernacular data:', error);
            }
        }
        if (selectedLanguage === reversalLanguage && !loadedReversalLetters.has(letter)) {
            console.log('Loading letter data:', letter);

            let fileIndex = 1;
            let moreFiles = true;
            let newWords = [];

            const letterIndex = alphabets.reversal.indexOf(letter);
            for (let i = 0; i < letterIndex; i++) {
                if (!loadedReversalLetters.has(alphabets.reversal[i])) {
                    console.log('Loading letter data first for loop:', alphabets.reversal[i]);
                    await loadLetterData(alphabets.reversal[i]);
                }
            }

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
            await fetchWords();
        }
        scrollToLetter(letter);
    }

    function switchLanguage(language) {
        sessionStorage.setItem('selectedLanguage', language);
        reversalWordsList = [];
        selectedLanguage = language;
        loadedReversalLetters = new Set();
        selectedLetter = currentAlphabet[0];
        fetchWords();
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
            fetchWords();
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
                <LexiconXmlView 
                {selectedWord}
                {vernacularWordsList}
                {vernacularLanguage}
                onSwitchLanguage={switchLanguage}
                onSelectWord={selectWord} />
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
