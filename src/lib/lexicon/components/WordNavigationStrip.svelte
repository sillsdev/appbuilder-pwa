<script lang="ts">
    import {
        compareWordsEqual,
        currentReversal,
        selectedWord,
        selectWord,
        vernacularLanguageId,
        vernacularWords,
        type Word
    } from '$lib/data/stores/lexicon.svelte';
    import HomonymSubscript from './HomonymSubscript.svelte';

    // List of all words (should come from either vernacularWordsList or reversalWordsList)
    let wordsList: Word[] = $derived(
        vernacularLanguageId.value === currentReversal.languageId
            ? vernacularWords.value
            : currentReversal.words
    );

    // Compute the index of the current word in the list
    let currentIndex: number | null = $derived(
        selectedWord.value &&
            wordsList.findIndex((word: Word) => compareWordsEqual(word, selectedWord.value))
    );

    // Compute previous and next words
    let previousWord: Word | null = $derived(
        currentIndex !== null && currentIndex > 0 ? wordsList[currentIndex - 1] : null
    );
    let nextWord: Word | null = $derived(
        currentIndex !== null && currentIndex < wordsList.length - 1
            ? wordsList[currentIndex + 1]
            : null
    );

    // Navigate to previous word
    function goToPrevious() {
        if (previousWord) {
            // Format the word object to match the expected structure
            selectWord(previousWord);
        }
    }

    // Navigate to next word
    function goToNext() {
        if (nextWord) {
            // Format the word object to match the expected structure
            selectWord(nextWord);
        }
    }
</script>

<div
    class="flex items-center justify-between p-2"
    style="background-color: var(--TabBackgroundColor); border-bottom: 1px solid var(--SettingsSeparatorColor);"
>
    <button
        class="flex items-center justify-center w-10 h-10 hover:opacity-75 disabled:opacity-50 disabled:cursor-not-allowed"
        style="color: var(--TabTextColor);"
        onclick={goToPrevious}
        disabled={!previousWord}
        aria-label="Previous word"
    >
        <div
            class="w-0 h-0 border-y-[12px] border-y-transparent border-r-[20px]"
            style="border-right-color: var(--PrimaryColor);"
        ></div>
    </button>

    <div
        class="text-center font-bold text-lg px-4 truncate max-w-xs"
        style="color: var(--TextColor);"
    >
        {selectedWord.value?.name || ''}
        <HomonymSubscript word={selectedWord.value} />
    </div>

    <button
        class="flex items-center justify-center w-10 h-10 hover:opacity-75 disabled:opacity-50 disabled:cursor-not-allowed"
        style="color: var(--TabTextColor);"
        onclick={goToNext}
        disabled={!nextWord}
        aria-label="Next word"
    >
        <div
            class="w-0 h-0 border-y-[12px] border-y-transparent border-l-[20px]"
            style="border-left-color: var(--PrimaryColor);"
        ></div>
    </button>
</div>
