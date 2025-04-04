<script>
    // Current word being displayed
    export let currentWord;

    // List of all words (should come from either vernacularWordsList or reversalWordsList)
    export let wordsList = [];

    // Function to handle word selection from parent component
    export let onSelectWord;

    // Compute the index of the current word in the list
    $: currentIndex = wordsList.findIndex((word) => {
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
    });

    // Compute previous and next words
    $: previousWord = currentIndex > 0 ? wordsList[currentIndex - 1] : null;
    $: nextWord = currentIndex < wordsList.length - 1 ? wordsList[currentIndex + 1] : null;

    // Navigate to previous word
    function goToPrevious() {
        if (previousWord) {
            // Format the word object to match the expected structure
            let wordObject;
            if (previousWord.name !== undefined) {
                wordObject = {
                    word: previousWord.name,
                    index: previousWord.id,
                    homonym_index: previousWord.homonym_index
                };
            } else {
                wordObject = {
                    word: previousWord.word,
                    indexes: previousWord.indexes
                };
            }
            onSelectWord(wordObject);
        }
    }

    // Navigate to next word
    function goToNext() {
        if (nextWord) {
            // Format the word object to match the expected structure
            let wordObject;
            if (nextWord.name !== undefined) {
                wordObject = {
                    word: nextWord.name,
                    index: nextWord.id,
                    homonym_index: nextWord.homonym_index
                };
            } else {
                wordObject = {
                    word: nextWord.word,
                    indexes: nextWord.indexes
                };
            }
            onSelectWord(wordObject);
        }
    }
</script>

<div class="flex items-center justify-between bg-[#e1bee8] p-2">
    <button
        class="flex items-center justify-center w-10 h-10 text-gray-700 hover:text-black disabled:opacity-50 disabled:cursor-not-allowed"
        on:click={goToPrevious}
        disabled={!previousWord}
        aria-label="Previous word"
    >
        <div
            class="w-0 h-0 border-y-[12px] border-y-transparent border-r-[20px] border-r-gray-700"
        ></div>
    </button>

    <div class="text-center font-bold text-lg px-4 truncate max-w-xs">
        {currentWord.word || ''}
        {#if currentWord.homonym_index > 0}
            <sub>{currentWord.homonym_index}</sub>
        {/if}
    </div>

    <button
        class="flex items-center justify-center w-10 h-10 text-gray-700 hover:text-black disabled:opacity-50 disabled:cursor-not-allowed"
        on:click={goToNext}
        disabled={!nextWord}
        aria-label="Next word"
    >
        <div
            class="w-0 h-0 border-y-[12px] border-y-transparent border-l-[20px] border-l-gray-700"
        ></div>
    </button>
</div>
