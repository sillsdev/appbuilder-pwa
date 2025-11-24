<script lang="ts">
    import Navbar from '$lib/components/Navbar.svelte';
    import config from '$lib/data/config';
    import {
        currentReversal,
        reversalLetters,
        reversalWords,
        vernacularLanguage,
        vernacularWords,
        type ReversalWord
    } from '$lib/data/stores/lexicon.svelte';
    import { SearchIcon } from '$lib/icons';
    import EntryView from '$lib/lexicon/components/EntryView.svelte';
    import ListViewHeader from '$lib/lexicon/components/ListViewHeader.svelte';
    import ReversalListView from '$lib/lexicon/components/ReversalListView.svelte';
    import VernacularListView from '$lib/lexicon/components/VernacularListView.svelte';
    import WordNavigationStrip from '$lib/lexicon/components/WordNavigationStrip.svelte';
    import { gotoRoute } from '$lib/navigate';
    import { onMount, tick } from 'svelte';
    import type { PageData } from './$types';

    const reversals = import.meta.glob('./**/*.json', {
        import: 'default',
        eager: true,
        base: '/src/gen-assets/reversal',
        query: '?url'
    }) as Record<string, string>;

    interface Props {
        data: PageData;
    }

    const { data }: Props = $props();

    const { vernacularAlphabet, reversalAlphabets, reversalLanguages, reversalIndexes } = data;

    const alphabets = {
        reversal: Object.values(reversalAlphabets[0])[0],
        vernacular: vernacularAlphabet
    };

    let selectedLetter = alphabets.vernacular[0];
    let selectedWord = $state(null);
    let showBackButton = $derived(selectedWord ? true : false);
    let defaultReversalKey = Object.keys(reversalAlphabets[0])[0];
    let scrollContainer: HTMLDivElement | undefined = $state(undefined);
    let wordIds: number[] | null = $state(null);

    //$: selectedLanguage = currentReversal.selectedLanguage;
    $effect(() => {
        currentReversal.selectedLanguage = vernacularLanguage.value;
    });

    const reversalLanguage = Object.values(reversalLanguages[0])[0];

    async function fetchWords(letter = selectedLetter) {
        if (
            currentReversal.selectedLanguage === reversalLanguage &&
            !currentReversal.letters.has(letter)
        ) {
            const letterIndex = alphabets.reversal.indexOf(letter);
            const lettersToLoad = alphabets.reversal
                .slice(0, letterIndex)
                .filter((l) => !currentReversal.letters.has(l));

            // Load all required letters in parallel
            await Promise.all(lettersToLoad.map(loadLetterData));

            // Load the current letter
            await loadLetterData(letter);

            // Sort the results based on the selectedLanguage's alphabet
            reversalWords[currentReversal.selectedLanguage] = (
                reversalWords[currentReversal.selectedLanguage] || []
            ).sort((a, b) => {
                const alphabet = currentAlphabet;
                return (
                    alphabet.indexOf(a.word[0].toLowerCase()) -
                    alphabet.indexOf(b.word[0].toLowerCase())
                );
            });
        }
    }

    async function loadLetterData(letter: string) {
        let newWords: ReversalWord[] = [];

        const index = reversalIndexes[defaultReversalKey];
        const files = index[letter] || [];
        for (const file of files) {
            const reversalFile = reversals[`./${defaultReversalKey}/${file}`];
            if (!reversalFile) {
                console.error(`Reversal file not found in glob: ./${defaultReversalKey}/${file}`);
                continue;
            }
            const response = await fetch(reversalFile);
            if (response.ok) {
                const data: Record<string, { index: number; name: 'string' }[]> =
                    await response.json();
                const currentFileWords = Object.entries(data).map(([word, entries]) => {
                    return {
                        word: word,
                        indexes: entries.map((entry) => entry.index),
                        vernacularWords: entries
                            .map((entry) => {
                                const foundWord = vernacularWords.value.find(
                                    (vw) => vw.id === entry.index
                                );
                                if (foundWord) {
                                    return {
                                        name: foundWord.name,
                                        homonymIndex: foundWord.homonym_index || 0
                                    };
                                } else {
                                    console.log(
                                        `Index ${entry.index} not found in vernacularWords`
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

        reversalWords[currentReversal.selectedLanguage] = [
            ...(reversalWords[currentReversal.selectedLanguage] || []),
            ...newWords
        ];

        reversalLetters[currentReversal.selectedLanguage] = [
            ...(reversalLetters[currentReversal.selectedLanguage] || []),
            letter
        ];
    }

    function selectWord(word) {
        selectedWord = selectedWord && selectedWord.word === word ? null : word;
        wordIds = selectedWord.indexes ? selectedWord.indexes : [selectedWord.index];
    }

    async function scrollToLetter(letter) {
        await tick();
        const target = document.getElementById(`letter-${letter}`);
        if (target && scrollContainer) {
            const containerTop = scrollContainer.getBoundingClientRect().top;
            const targetTop = target.getBoundingClientRect().top;
            const offset = targetTop - containerTop + scrollContainer.scrollTop;

            scrollContainer.scrollTo({
                top: offset
            });
        }
    }

    async function handleLetterChange(letter: string) {
        selectedLetter = letter;
        if (currentReversal.selectedLanguage === reversalLanguage) {
            await fetchWords();
        }
        scrollToLetter(letter);
    }

    function switchLanguage(language: string) {
        currentReversal.selectedLanguage = language;
        selectedLetter = currentAlphabet[0];
        if (currentReversal.selectedLanguage != vernacularLanguage.value) {
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
            (currentReversal.selectedLanguage === reversalLanguage &&
                currentReversal.words.length > 0) ||
            (currentReversal.selectedLanguage === vernacularLanguage.value &&
                vernacularWords.value.length > 0)
        ) {
            let div = event.target;
            const threshold = 100;

            if (div.scrollHeight - div.scrollTop - div.clientHeight < threshold) {
                const currentIndex = currentAlphabet.indexOf(selectedLetter);
                if (!currentReversal.letters.has(currentAlphabet[currentIndex + 1])) {
                    if (currentIndex < currentAlphabet.length - 1) {
                        isFetching = true;
                        await fetchWords(currentAlphabet[currentIndex + 1]);
                        isFetching = false;
                    }
                }
            } else if (
                (currentReversal.selectedLanguage === reversalLanguage &&
                    currentReversal.letters.has(selectedLetter)) ||
                currentReversal.selectedLanguage === vernacularLanguage.value
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

    let currentAlphabet = $derived(
        currentReversal.selectedLanguage === reversalLanguage
            ? alphabets.reversal
            : alphabets.vernacular
    );

    onMount(() => {
        if (selectedLetter && currentReversal.selectedLanguage != vernacularLanguage.value) {
            fetchWords();
        }
        if (config.programType !== 'DAB') {
            gotoRoute(`/text`);
        }
    });
</script>

<div
    class="grid fixed bg-base-100"
    class:grid-rows-[auto,auto,1fr]={selectedWord}
    class:grid-rows-[auto,1fr]={!selectedWord}
    style="height:100vh;height:100dvh;width:100vw;background-color: var(--BackgroundColor);"
>
    <Navbar {showBackButton}>
        {#snippet start()}
            <label for="sidebar" class="navbar">
                <div class="btn btn-ghost normal-case text-xl text-white font-bold pl-1">
                    {config.name}
                </div>
            </label>
        {/snippet}
        {#snippet end()}
            <div class="flex flex-nowrap">
                <div id="extraButtons" class:pr-4={!selectedWord}>
                    <button
                        class="dy-btn dy-btn-ghost dy-btn-circle"
                        onclick={() => {
                            wordIds = null;
                            gotoRoute(`/lexicon/search`);
                        }}
                    >
                        <SearchIcon color="white" />
                    </button>
                </div>
            </div>
        {/snippet}
    </Navbar>

    {#if !selectedWord}
        <ListViewHeader
            alphabet={currentAlphabet}
            selectedLanguage={currentReversal.selectedLanguage}
            vernacularLanguage={vernacularLanguage.value}
            {reversalLanguage}
            onSwitchLanguage={switchLanguage}
            onLetterChange={handleLetterChange}
        />
    {/if}

    {#if selectedWord}
        <WordNavigationStrip currentWord={selectedWord} onSelectWord={selectWord} />
        <div
            class="flex-1 overflow-y-auto bg-base-100"
            style="background-color: var(--BackgroundColor);"
            bind:this={scrollContainer}
            onscroll={checkIfScrolledToBottom}
        >
            <EntryView {wordIds} onSelectWord={selectWord} />
        </div>
    {:else if currentReversal.selectedLanguage === vernacularLanguage.value}
        <div
            class="flex-1 overflow-y-auto bg-base-100"
            style="background-color: var(--BackgroundColor);"
            bind:this={scrollContainer}
            onscroll={checkIfScrolledToBottom}
        >
            <VernacularListView
                vernacularWordsList={vernacularWords.value}
                onSelectWord={selectWord}
            />
        </div>
    {:else}
        <div
            id="container"
            class="flex-1 overflow-y-auto bg-base-100 width-full"
            style="background-color: var(--BackgroundColor);"
            bind:this={scrollContainer}
            onscroll={checkIfScrolledToBottom}
        >
            <ReversalListView reversalWordsList={currentReversal.words} onSelectWord={selectWord} />
        </div>
    {/if}
</div>
