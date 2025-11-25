<script lang="ts">
    import {
        currentReversal,
        vernacularLanguage,
        vernacularWords
    } from '$lib/data/stores/lexicon.svelte';

    interface Props {
        /** Current word being displayed */
        currentWord: any;
        /** Function to handle word selection from parent component */
        onSelectWord: (word: any) => void;
    }

    let { currentWord, onSelectWord }: Props = $props();

    // List of all words (should come from either vernacularWordsList or reversalWordsList)
    let wordsList = $derived(
        vernacularLanguage.value === currentReversal.selectedLanguage
            ? vernacularWords.value
            : currentReversal.words
    );

    // Compute the index of the current word in the list
    let currentIndex = $derived(
        wordsList.findIndex((word) => {
            // Handle both vernacular and reversal word structures
            if (typeof word === 'object') {
                if (word.id && currentWord.index) {
                    // For vernacular words, match by ID which is unique
                    return word.id === currentWord.index;
                } else if (
                    word.name &&
                    currentWord.word &&
                    word.homonym_index !== undefined &&
                    currentWord.homonym_index !== undefined
                ) {
                    // For vernacular words with homonyms, match both word and homonym index
                    return (
                        word.name === currentWord.word &&
                        word.homonym_index === currentWord.homonym_index
                    );
                } else if (word.name && currentWord.word) {
                    // For regular vernacular words
                    return word.name === currentWord.word;
                } else if (word.word && currentWord.word) {
                    // For reversal words
                    return word.word === currentWord.word;
                }
            }
            return false;
        })
    );

    // Compute previous and next words
    let previousWord = $derived(currentIndex > 0 ? wordsList[currentIndex - 1] : null);
    let nextWord = $derived(
        currentIndex < wordsList.length - 1 ? wordsList[currentIndex + 1] : null
    );

    // Navigate to previous word
    function goToPrevious() {
        if (previousWord) {
            // Format the word object to match the expected structure
            onSelectWord(
                'name' in previousWord
                    ? {
                          word: previousWord.name,
                          index: previousWord.id,
                          homonym_index: previousWord.homonym_index
                      }
                    : previousWord
            );
        }
    }

    // Navigate to next word
    function goToNext() {
        if (nextWord) {
            // Format the word object to match the expected structure
            onSelectWord(
                'name' in nextWord
                    ? {
                          word: nextWord.name,
                          index: nextWord.id,
                          homonym_index: nextWord.homonym_index
                      }
                    : nextWord
            );
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
        {currentWord.word || ''}
        {#if currentWord.homonym_index > 0}
            <sub>{currentWord.homonym_index}</sub>
        {/if}
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
