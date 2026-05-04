<script lang="ts">
    import { afterNavigate } from '$app/navigation';
    import SearchForm from '$lib/components/SearchForm.svelte';
    import { selectedWord, selectWord, wordIDs } from '$lib/data/stores/lexicon.svelte';
    import EntryView from '$lib/lexicon/components/EntryView.svelte';
    import WordNavigationStrip from '$lib/lexicon/components/WordNavigationStrip.svelte';
    import { searchDictionary } from '$lib/search-worker/dab-search-worker';
    import type { SearchOptions } from '$lib/search/domain/interfaces/data-interfaces';
    import { type SearchFormSubmitEvent } from '$lib/types.js';

    let phrase: string = $state('');
    let wholeWords: boolean = $state(false);
    let matchAccents: boolean = $state(false);
    // cache search word for display
    let searchWord: string | undefined = $state();

    let scrollDiv: HTMLDivElement | undefined = $state(undefined);

    // Handle form submission from SearchForm component
    async function handleSearchSubmit(event: SearchFormSubmitEvent) {
        const {
            phrase: newPhrase,
            wholeWords: newWholeWords,
            matchAccents: newMatchAccents
        } = event;

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
            wordIDs.value = await searchDictionary(phrase, options);
        } catch (err) {
            console.error('Search failed', err);
            wordIDs.value = [];
        }
        console.log($state.snapshot(wordIDs.value));

        // clear search bar after search submitted
        phrase = '';
    }

    afterNavigate(() => (searchWord = ''));
</script>

{#if !selectedWord.value}
    <div class="flex w-full" style="background-color: var(--TitleBackgroundColor);">
        <div
            class="py-2 px-6 font-bold text-center relative text-sm flex items-center justify-center w-full"
            style="height: 36px; color: var(--TextColor);"
        >
            {searchWord ? `Search: ${searchWord}` : 'Search'}
        </div>
    </div>
{/if}
<div class="flex-1 overflow-y-auto width-full" style="background-color: var(--BackgroundColor);">
    <div class="overflow-auto" bind:this={scrollDiv}>
        <div class="flex justify-center">
            {#if !searchWord && !wordIDs.value.length}
                <SearchForm {phrase} {wholeWords} {matchAccents} submit={handleSearchSubmit} />
            {/if}
        </div>

        <div class="flex justify-center px-4">
            <hr
                class="max-w-screen-md w-full"
                style="border-color: var(--SettingsSeparatorColor);"
            />
        </div>

        {#if selectedWord.value}
            <WordNavigationStrip currentWord={selectedWord.value} onSelectWord={selectWord} />
        {/if}

        <div class="flex justify-center">
            <div class="flex-1 overflow-auto justify-center px-4 w-full max-w-screen-md p-4">
                {#if wordIDs.value.length > 0}
                    <EntryView removeNewLines />
                {:else if searchWord && !wordIDs.value.length}
                    <div class="text-center" style="color: var(--SettingsSummaryColor);">
                        No results found.
                    </div>
                {/if}
            </div>
        </div>
    </div>
</div>
