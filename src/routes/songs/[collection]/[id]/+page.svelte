<script lang="ts">
    import { goto } from '$app/navigation';
    import { resolve } from '$app/paths';
    import config from '$assets/config';
    import BookSelector from '$lib/components/BookSelector.svelte';
    import ChapterSelector from '$lib/components/ChapterSelector.svelte';
    import Navbar from '$lib/components/Navbar.svelte';
    import {
        actionBarColor,
        bodyFontSize,
        convertStyle,
        nextRef,
        refs,
        s,
        t
    } from '$lib/data/stores';
    import { SearchIcon } from '$lib/icons';
    import { navigateToText } from '$lib/navigate';
    import type { PageData } from './$types.js';

    interface Props {
        data: PageData;
    }
    let { data }: Props = $props();

    const showSearch = !!config.mainFeatures['search'];
    let tabs = $derived([$t['Song_List_By_Number'], $t['Song_List_By_Title']]);
    let curTab = $state(0);
    function changeTab(newTab: number) {
        curTab = newTab;
    }
    let actionBarBackgroundColor = $derived($s?.['ui.bar.action']['background-color']);
    let tabUnderlineColor = $derived($s?.['ui.song.tabs']['color']);
    let borderColor = $derived($s?.['ui.song.border']['background-color']);
    const songArray = $derived(curTab === 0 ? data.songsByNumber : data.songsByTitle);

    async function completeNavigation(songNumber: string) {
        nextRef.reset();
        await navigateToText({
            docSet: $refs.docSet,
            collection: $refs.collection,
            book: $refs.book,
            chapter: songNumber,
            verse: $nextRef.verse
        });
    }
</script>

<div class="grid grid-rows-[auto_1fr] h-screen overflow-y-auto" style:font-size="{$bodyFontSize}px">
    <div class="navbar">
        <Navbar>
            {#snippet start()}
                <BookSelector />
                <ChapterSelector />
            {/snippet}
            {#snippet end()}
                <div class="flex items-center">
                    {#if showSearch}
                        <button
                            class="dy-btn dy-btn-ghost dy-btn-circle"
                            onclick={() => goto(resolve(`/search/${$refs.collection}`))}
                        >
                            <SearchIcon color={$actionBarColor} />
                        </button>
                    {/if}
                </div>
            {/snippet}
        </Navbar>
    </div>
    <div class="min-h-0">
        <div
            class="border-t border-base-content/10 dy-tabs dy-tabs-border w-full justify-start"
            style:background-color={actionBarBackgroundColor}
        >
            {#each tabs as songTab, i}
                <button
                    class="dy-tab {curTab === i ? 'dy-tab-active' : ''} "
                    onclick={() => changeTab(i)}
                    style={convertStyle($s?.['ui.song.tabs'])}
                    style:border-color={curTab === i ? tabUnderlineColor : ''}
                >
                    {songTab}
                </button>
            {/each}
        </div>
        {#each songArray as song}
            <button
                class="w-full block justify-start text-left pl-10 border"
                style:border-color={borderColor}
                onclick={() => completeNavigation(song.number)}
            >
                <span style={convertStyle($s?.['ui.song.number'])}>{song.number}</span>
                <span class="pl-2" style={convertStyle($s?.['ui.song.title'])}>{song.title}</span>
            </button>
        {/each}
    </div>
</div>
