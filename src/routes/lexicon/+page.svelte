<script lang="ts">
    import Navbar from '$lib/components/Navbar.svelte';
    import config from '$lib/data/config';
    import {
        currentReversal,
        displayNames,
        isSelectedVernacular,
        isVernacular,
        reversalLetters,
        reversalWords,
        vernacularLanguageId,
        vernacularWords,
        type ReversalWord,
        type SelectedWord,
        type VernacularWord,
        type VernacularWordReference
    } from '$lib/data/stores/lexicon.svelte';
    import { SearchIcon } from '$lib/icons';
    import EntryView from '$lib/lexicon/components/EntryView.svelte';
    import HomonymSubscript from '$lib/lexicon/components/HomonymSubscript.svelte';
    import WordNavigationStrip from '$lib/lexicon/components/WordNavigationStrip.svelte';
    import { gotoRoute } from '$lib/navigate';
    import { onMount, tick } from 'svelte';
    import { expoInOut } from 'svelte/easing';
    import { fly } from 'svelte/transition';
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
        reversal: reversalAlphabets.length > 0 ? Object.values(reversalAlphabets[0])[0] : [],
        vernacular: vernacularAlphabet
    };

    let selectedLetter = alphabets.vernacular[0];
    let selectedWord: SelectedWord | null = $state(null);
    let showBackButton = $derived(selectedWord ? true : false);
    let scrollContainer: HTMLDivElement | undefined = $state(undefined);
    let wordIds: number[] | null = $state(null);

    //$: selectedLanguage = currentReversal.selectedLanguage;
    $effect(() => {
        // NOTE: currentReversal is not a dependency of this $effect.
        // Do not make it a dependency, or this will not work.
        // If you need to console.log in here for debugging, make sure to use `untrack`.
        currentReversal.languageId = vernacularLanguageId.value;
    });

    const validReversal = $derived(reversalLanguages.includes(currentReversal.languageId));

    async function fetchWords(letter = selectedLetter) {
        if (validReversal && !currentReversal.letters.has(letter)) {
            const letterIndex = alphabets.reversal.indexOf(letter);
            const lettersToLoad = alphabets.reversal
                .slice(0, letterIndex)
                .filter((l) => !currentReversal.letters.has(l));

            // Load all required letters in parallel
            await Promise.all(lettersToLoad.map(loadLetterData));

            // Load the current letter
            await loadLetterData(letter);

            // Sort the results based on the selectedLanguage's alphabet
            reversalWords[currentReversal.languageId] = (
                reversalWords[currentReversal.languageId] || []
            ).sort((a, b) => {
                const alphabet = currentAlphabet;
                return alphabet.indexOf(a.letter) - alphabet.indexOf(b.letter);
            });
        }
    }

    async function loadLetterData(letter: string) {
        let newWords: ReversalWord[] = [];

        const reversalKey =
            currentReversal.languageId ||
            (reversalAlphabets.length > 0 ? Object.keys(reversalAlphabets[0])[0] : '');

        const index = reversalIndexes[reversalKey];
        if (!index) {
            console.error(`No reversal index loaded for language: ${reversalKey}`);
            return;
        }
        const files = index[letter] || [];
        for (const file of files) {
            const reversalFile = reversals[`./${reversalKey}/${file}`];
            if (!reversalFile) {
                console.error(`Reversal file not found in glob: ./${reversalKey}/${file}`);
                continue;
            }
            const response = await fetch(reversalFile);
            if (response.ok) {
                const data: Record<string, { index: number; name: 'string' }[]> =
                    await response.json();
                const currentFileWords: ReversalWord[] = Object.entries(data).map(
                    ([name, entries]) => ({
                        name,
                        indexes: entries.map((entry) => entry.index),
                        vernacularWords: entries
                            .map((entry) => {
                                const foundWord: VernacularWord = vernacularWords.value.find(
                                    (vw) => vw.id === entry.index
                                );
                                if (foundWord) {
                                    return {
                                        name: foundWord.name,
                                        homonym_index: foundWord.homonym_index || 0
                                    } satisfies VernacularWordReference;
                                } else {
                                    console.log(
                                        `Index ${entry.index} not found in vernacularWords`
                                    );
                                    return null; // Return null for missing indexes
                                }
                            })
                            .filter((index) => index !== null), // Filter out null values
                        letter: letter
                    })
                );

                currentFileWords.forEach((newWord) => {
                    const existingWord = newWords.find((w) => w.name === newWord.name);
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

        reversalWords[currentReversal.languageId] = [
            ...(reversalWords[currentReversal.languageId] || []),
            ...newWords
        ];

        reversalLetters[currentReversal.languageId] = [
            ...(reversalLetters[currentReversal.languageId] || []),
            letter
        ];
    }

    function selectWord(word: SelectedWord) {
        selectedWord = selectedWord && selectedWord.name === word.name ? null : word;
        wordIds = selectedWord
            ? isSelectedVernacular(selectedWord)
                ? [selectedWord.id]
                : selectedWord.indexes
            : [];
    }

    async function scrollToLetter(letter: string) {
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
        if (validReversal) {
            await fetchWords();
        }
        scrollToLetter(letter);
    }

    function switchLanguage(language: string) {
        currentReversal.languageId = language;
        selectedLetter = currentAlphabet[0];
        if (currentReversal.languageId != vernacularLanguageId.value) {
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
            (validReversal && currentReversal.words.length > 0) ||
            (currentReversal.languageId === vernacularLanguageId.value &&
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
                (validReversal && currentReversal.letters.has(selectedLetter)) ||
                currentReversal.languageId === vernacularLanguageId.value
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

    let currentAlphabet = $derived(validReversal ? alphabets.reversal : alphabets.vernacular);

    onMount(() => {
        if (selectedLetter && currentReversal.languageId != vernacularLanguageId.value) {
            fetchWords();
        }
        if (config.programType !== 'DAB') {
            gotoRoute(`/text`);
        }
    });

    let previousLanguage = $state(currentReversal.languageId);
</script>

<div
    class="grid fixed bg-base-100"
    class:grid-rows-[auto,auto,1fr]={selectedWord}
    class:grid-rows-[auto,1fr]={!selectedWord}
    style="height:100vh;height:100dvh;width:100vw;background-color: var(--BackgroundColor);"
>
    <Navbar {showBackButton}>
        {#snippet start()}
            <label for="sidebar">
                <div class="dy-btn dy-btn-ghost normal-case text-xl text-white font-bold pl-1">
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

    {#if selectedWord}
        <WordNavigationStrip currentWord={selectedWord} onSelectWord={selectWord} />
    {:else}
        {@const tabs = [vernacularLanguageId.value, ...reversalLanguages]}
        {@const indexOfPrevious = tabs.indexOf(previousLanguage)}
        <div class="flex w-full" style="background-color: var(--TabBackgroundColor);">
            {#each tabs as lang, i}
                <button
                    aria-pressed={currentReversal.languageId === lang}
                    onclick={() => {
                        previousLanguage = currentReversal.languageId;
                        switchLanguage(lang);
                    }}
                    class="py-2.5 px-3.5 text-sm uppercase text-center relative dy-tabs dy-tabs-bordered mb-1"
                >
                    {displayNames.value[lang]}
                    {#if currentReversal.languageId === lang}
                        <div
                            transition:fly={{ easing: expoInOut, x: 70 * (indexOfPrevious - i) }}
                            class="absolute -bottom-1 left-0 w-full h-1 bg-black"
                        ></div>
                    {/if}
                </button>
            {/each}
            <div class="flex-1"></div>
        </div>

        <div
            class="flex m-2 gap-1 md:gap-2 mb-4 justify-start overflow-x-auto whitespace-nowrap pb-2 snap-x"
        >
            {#each currentAlphabet as letter}
                <button
                    class="px-3 py-2 text-sm font-bold border rounded-md cursor-pointer snap-start
                    sm:px-4 sm:py-3 sm:text-base
                    md:px-5 md:py-4 md:text-base
                    lg:px-6 lg:py-4 lg:text-lg"
                    style="border-color: var(--SettingsSeparatorColor);"
                    onclick={() => handleLetterChange(letter)}
                >
                    {letter}
                </button>
            {/each}
        </div>
    {/if}

    <div
        class="flex-1 overflow-y-auto bg-base-100"
        bind:this={scrollContainer}
        onscroll={checkIfScrolledToBottom}
    >
        {#if selectedWord}
            <EntryView {wordIds} onSelectWord={selectWord} />
        {:else}
            {@const usingVernacular = currentReversal.languageId === vernacularLanguageId.value}
            {@const words = usingVernacular ? vernacularWords.value : currentReversal.words}
            <ul
                class="space-y-3 px-4 pb-4"
                style="background-color: var(--BackgroundColor); color: var(--TextColor);"
            >
                {#each words as word}
                    <li class="cursor-pointer text-lg mb-3 scroll-mt-16" id="letter-{word.letter}">
                        <button
                            type="button"
                            class="w-full text-left py-1"
                            aria-label={`Select word ${word.name}`}
                            style="border-bottom: 1px solid var(--SettingsSeparatorColor);"
                            onclick={() => selectWord(word)}
                        >
                            <span class="font-bold break-words" lang={currentReversal.languageId}>
                                {word.name}<HomonymSubscript {word} />
                            </span>
                            {#if usingVernacular && isVernacular(word) && word.summary}
                                {@const matches = word.summary.match(/{(.*?)}/g) || []}
                                <p class="ml-4">
                                    {#if matches.length}
                                        <span class="italic">
                                            {#each matches as match}
                                                {match.replace(/[{}]/g, '')}
                                            {/each}
                                        </span>
                                    {/if}
                                    {word.summary.replaceAll(/{(.*?)}/g, '')}
                                </p>
                            {:else if !isVernacular(word)}
                                <br />
                                <span class="ml-4">
                                    {#each word.vernacularWords as ref, i}
                                        {#if i > 0},
                                        {/if}
                                        <span>
                                            {ref.name}<HomonymSubscript word={ref} />
                                        </span>
                                    {/each}
                                </span>
                            {/if}
                        </button>
                    </li>
                {/each}
            </ul>
        {/if}
    </div>
</div>
