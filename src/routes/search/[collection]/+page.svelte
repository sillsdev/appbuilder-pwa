<script lang="ts">
    import { t, themeColors } from '$lib/data/stores';
    import Navbar from '$lib/components/Navbar.svelte';
    import SearchForm from '$lib/components/SearchForm.svelte';
    import type { SearchResult } from '$lib/search/domain/entities';
    import type { SearchPresenter } from '$lib/search/domain/interfaces/presentation-interfaces';
    import { makeSearchConfigManager, makeSearchSession } from '$lib/search/factories';
    import SearchResultList from '$lib/components/SearchResultList.svelte';
    import type { ComponentEvents } from 'svelte';

    export let data;

    let results: SearchResult[] = [];
    let queryId = 0;
    let queryDone = false;

    const presenter: SearchPresenter = {
        onResults: function (newResults: SearchResult[]): void {
            results = results.concat(newResults);
        },
        onNewQuery: function (): void {
            results = [];
            queryDone = false;
        },

        onQueryDone: function (): void {
            queryDone = true;
        }
    };

    const configManager = makeSearchConfigManager();
    const session = makeSearchSession(presenter);

    function handleSubmit(event: ComponentEvents<SearchForm>['submit']) {
        queryId++;
        const options = configManager.configureOptions({
            collection: data.collection,
            wholeWords: event.detail.wholeWords,
            matchAccents: event.detail.matchAccents
        });
        session.submit(event.detail.phrase, options, 1);
    }
</script>

<div class="grid grid-rows-[auto,1fr,auto]" style="height:100vh;height:100dvh;">
    <div class="navbar">
        <Navbar>
            <label for="sidebar" slot="center">
                <div class="btn btn-ghost normal-case text-xl">{$t['Search']}</div>
            </label>
        </Navbar>
    </div>

    <div class="overflow-auto">
        <div class="flex justify-center">
            <SearchForm on:submit={handleSubmit} />
        </div>

        <div class="flex justify-center px-4">
            <hr class="max-w-screen-md w-full" style:border-color={$themeColors.DividerColor} />
        </div>

        <!-- Last div which can scroll if content overflows -->
        <div class="flex justify-center">
            <SearchResultList collection={data.collection} {results} {queryId} {queryDone} />
        </div>
    </div>
</div>

<style>
    /* Add any custom styles here if needed */
</style>
