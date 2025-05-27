<script lang="ts">
    import { goto } from '$app/navigation';
    import LexiconEntryView from '$lib/components/LexiconEntryView.svelte';
    import Navbar from '$lib/components/Navbar.svelte';
    import SearchForm from '$lib/components/SearchForm.svelte';
    import WordNavigationStrip from '$lib/components/WordNavigationStrip.svelte';
    import config from '$lib/data/config';
    import { themeColors } from '$lib/data/stores';
    import { vernacularLanguageStore, vernacularWordsStore } from '$lib/data/stores/lexicon';
    import { SearchIcon } from '$lib/icons';
    import { getRoute } from '$lib/navigate';
    import { searchDictionary } from '$lib/search-worker/dab-search-worker';
    import type { SearchOptions } from '$lib/search/domain/interfaces/data-interfaces';

    export let data;

    let phrase: string = '';
    let wholeWords: boolean = false;
    let matchAccents: boolean = false;
    let wordIds;
    let searchWord;
    let vernacularLanguage;
    let selectedWord;
    $: vernacularLanguage = $vernacularLanguageStore;

    let vernacularWordsList;
    $: vernacularWordsList = $vernacularWordsStore;

    let scrollDiv;

    // Handle form submission from SearchForm component
    async function handleSearchSubmit(event) {
        const {
            phrase: newPhrase,
            wholeWords: newWholeWords,
            matchAccents: newMatchAccents
        } = event.detail;

        let options: SearchOptions = {
            docSet: '',
            collection: '',
            wholeWords: newWholeWords,
            accentsAndTones: newMatchAccents
        };

        searchWord = newPhrase;
        phrase = newPhrase;
        wholeWords = newWholeWords;
        matchAccents = newMatchAccents;
        try {
            wordIds = await searchDictionary(phrase, options);
        } catch (err) {
            console.error('Search failed', err);
            wordIds = [];
        }
        console.log(wordIds);
    }

    function selectWord(word) {
        selectedWord = selectedWord && selectedWord.word === word ? null : word;
        wordIds = selectedWord.indexes ? selectedWord.indexes : [selectedWord.index];
    }
</script>

<div
    class="grid grid-rows-[auto,auto,1fr] fixed bg-base-100"
    style="height:100vh;height:100dvh;width:100vw;background-color: var(--BackgroundColor);"
>
    <Navbar>
        {#snippet start()}
            <label for="sidebar" class="navbar">
                <div
                    class="btn btn-ghost normal-case text-xl text-white font-bold pl-1"
                    style="color: var(--ShareButtonTextColor);"
                >
                    {searchWord ? `${config.name}` : 'Search'}
                </div>
            </label>
        {/snippet}
        {#snippet end()}
            <div class="flex flex-nowrap">
                <div id="extraButtons">
                    <button
                        class="dy-btn dy-btn-ghost dy-btn-circle"
                        style="color: var(--ShareButtonTextColor);"
                        on:click={() => {
                            wordIds = null;
                            searchWord = '';
                            selectedWord = null;
                            goto(getRoute(`/lexicon/search`));
                        }}
                    >
                        <SearchIcon color="white" />
                    </button>
                </div>
            </div>
        {/snippet}
    </Navbar>
    <div class="h-full">
        {#if !selectedWord}
            <div class="flex w-full" style="background-color: var(--TitleBackgroundColor);">
                <div
                    class="py-2 px-6 font-bold text-center relative text-sm flex items-center justify-center w-full"
                    style="height: 36px; color: var(--TextColor);"
                >
                    {searchWord ? `Search: ${searchWord}` : 'Search'}
                </div>
            </div>
        {/if}
    </div>
    <div
        class="flex-1 overflow-y-auto width-full"
        style="background-color: var(--BackgroundColor);"
    >
        <div class="overflow-auto" bind:this={scrollDiv}>
            <div class="flex justify-center">
                {#if !wordIds || wordIds.length == 0}
                    <SearchForm
                        bind:phrase
                        bind:wholeWords
                        bind:matchAccents
                        on:submit={handleSearchSubmit}
                    />
                {/if}
            </div>

            <div class="flex justify-center px-4">
                <hr
                    class="max-w-screen-md w-full"
                    style="border-color: var(--SettingsSeparatorColor);"
                />
            </div>

            {#if selectedWord}
                <WordNavigationStrip currentWord={selectedWord} onSelectWord={selectWord} />
            {/if}

            <div class="flex justify-center">
                <div class="flex-1 overflow-auto justify-center px-4 w-full max-w-screen-md p-4">
                    {#if wordIds && wordIds.length > 0}
                        <LexiconEntryView {wordIds} onSelectWord={selectWord} removeNewLines />
                    {:else if wordIds && wordIds.length == 0}
                        <div class="text-center" style="color: var(--SettingsSummaryColor);">
                            No results found.
                        </div>
                    {/if}
                </div>
            </div>
        </div>
    </div>
</div>
