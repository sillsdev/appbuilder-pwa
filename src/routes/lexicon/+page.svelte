<script>
    import LexiconEntryView from '$lib/components/LexiconEntryView.svelte';
    import LexiconListView from '$lib/components/LexiconListView.svelte';
    import LexiconListViewHeader from '$lib/components/LexiconListViewHeader.svelte';
    import Navbar from '$lib/components/Navbar.svelte';
    import WordNavigationStrip from '$lib/components/WordNavigationStrip.svelte';
    import config from '$lib/data/config';
    import { lexicon, selected } from '$lib/data/lexicon.svelte';
    import { SearchIcon } from '$lib/icons';
    import { gotoRoute } from '$lib/navigate';
    import { onMount, tick } from 'svelte';

    const alphabets = lexicon.alphabets();
    let selectedLetter = alphabets.vernacular[0];
    let selectedWord = $state(null);
    const showBackButton = $derived(selectedWord ? true : false);
    //let defaultReversalKey = Object.keys(reversalAlphabets[0])[0];

    let reversalLetters = $derived(lexicon.currentReversalLetters());
    let vernacularWords = $derived(lexicon.currentVernacularWords());
    let scrollContainer;
    let wordIds = $derived(selectedWord.indexes || null);
    const { vernacularLanguage, reversalLanguages } = lexicon.languages();
    const reversalLanguage = Object.values(reversalLanguages)[1];
    let reversalWords = $derived(lexicon.currentReversalWords(reversalLanguage));

    let currentAlphabet = $derived(
        selected.language === reversalLanguage
            ? alphabets.reversal[alphabets.keys[reversalLanguage]] // TODO Re-key this baby to work with the proper name of a language
            : alphabets.vernacular
    );

    function onSelectWord(word) {
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
                top: offset
            });
        }
    }

    async function onLetterChange(letter) {
        selectedLetter = letter;
        await lexicon.fetchReversalWords({
            letter,
            language: selected.language
        });
        scrollToLetter(letter);
    }

    function onSwitchLanguage(language) {
        selected.language = language;
        selectedLetter = currentAlphabet[0];
        if (selected.language !== vernacularLanguage) {
            lexicon.fetchReversalWords({
                letter: selectedLetter,
                language: language
            });
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
            (selected.language === reversalLanguage && reversalWords.length > 0) ||
            (selected.language === vernacularLanguage && vernacularWords.length > 0)
        ) {
            let div = event.target;
            const threshold = 100;

            if (div.scrollHeight - div.scrollTop - div.clientHeight < threshold) {
                const currentIndex = currentAlphabet.indexOf(selectedLetter);
                if (!reversalLetters.has(currentAlphabet[currentIndex + 1])) {
                    if (currentIndex < currentAlphabet.length - 1) {
                        isFetching = true;
                        await lexicon.fetchReversalWords({
                            letter: currentAlphabet[currentIndex + 1],
                            language: reversalLanguage
                        });
                        isFetching = false;
                    }
                }
            } else if (
                (selected.language === reversalLanguage && reversalLetters.has(selectedLetter)) ||
                selected.language === vernacularLanguage
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

    onMount(() => {
        if (config.programType !== 'DAB') {
            gotoRoute(`/text`);
        } else if (selectedLetter && selected.language != vernacularLanguage) {
            lexicon.fetchReversalWords({
                letter: selectedLetter,
                language: reversalLanguage
            });
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
        <LexiconListViewHeader
            alphabet={currentAlphabet}
            selectedLanguage={selected.language}
            {vernacularLanguage}
            {reversalLanguage}
            {onSwitchLanguage}
            {onLetterChange}
        />

        <div
            class="flex-1 overflow-y-auto bg-base-100"
            style="background-color: var(--BackgroundColor);"
            bind:this={scrollContainer}
        >
            <LexiconListView
                words={selected.language === vernacularLanguage ? vernacularWords : reversalWords}
                {onSelectWord}
            />
        </div>
    {:else}
        <WordNavigationStrip
            currentWord={selectedWord}
            selectedLanguage={selected.language}
            wordsList={selected.language === vernacularLanguage ? vernacularWords : reversalWords}
            {onSelectWord}
        />
        <div
            class="flex-1 overflow-y-auto bg-base-100"
            style="background-color: var(--BackgroundColor);"
            bind:this={scrollContainer}
        >
            <LexiconEntryView {wordIds} {onSelectWord} />
        </div>
    {/if}
</div>
