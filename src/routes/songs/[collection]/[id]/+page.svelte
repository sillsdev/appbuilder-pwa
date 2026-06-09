<script lang="ts">
    import { goto } from '$app/navigation';
    import { resolve } from '$app/paths';
    import config from '$assets/config';
    import BookSelector from '$lib/components/BookSelector.svelte';
    import ChapterSelector from '$lib/components/ChapterSelector.svelte';
    import Navbar from '$lib/components/Navbar.svelte';
    import { bodyFontSize, convertStyle, nextRef, refs, s, t } from '$lib/data/stores';
    import { SearchIcon } from '$lib/icons';
    import { navigateToText } from '$lib/navigate';
    import type { PageData } from './$types.js';

    interface Props {
        data: PageData;
    }
    let { data }: Props = $props();

    let songsByTitle: { number: string; title: string }[] = [];
    let songsByNumber: { number: string; title: string }[] = [];
    (() => {
        data.titleData.split('\r\n').forEach((value) => {
            let separatedValue = value.split('\t');
            if (separatedValue.length === 2) {
                songsByTitle.push({ number: separatedValue[0], title: separatedValue[1] });
            }
        });
        data.numberData.split('\r\n').forEach((value) => {
            let separatedValue = value.split('\t');
            if (separatedValue.length === 2) {
                songsByNumber.push({ number: separatedValue[0], title: separatedValue[1] });
            }
        });
    })();

    const showSearch = !!config.mainFeatures['search'];
    let tabs = [$t['Song_List_By_Number'], $t['Song_List_By_Title']];
    let curTab = $state(0);
    function changeTab(newTab: number) {
        curTab = newTab;
    }
    let actionBarColor = $derived($s?.['ui.bar.action']['background-color']);
    let tabUnderlineColor = $derived($s?.['ui.song.tabs']['color']);
    let borderColor = $derived($s?.['ui.song.border']['background-color']);
    const songArray = $derived(curTab === 0 ? songsByNumber : songsByTitle);

    async function completeNavigation(songNumber: string) {
        await navigateToText({
            docSet: $refs.docSet,
            collection: $refs.collection,
            book: $refs.book,
            chapter: songNumber,
            verse: $nextRef.verse
        });
    }
</script>

<div class="grid grid-rows-[auto,1fr] h-screen overflow-y-auto" style:font-size="{$bodyFontSize}px">
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
                            <SearchIcon color="white" />
                        </button>
                    {/if}
                </div>
            {/snippet}
        </Navbar>
    </div>
    <div class="min-h-0">
        <div
            class="border-t border-base-content/10 dy-tabs dy-tabs-bordered w-full justify-start"
            style:background-color={actionBarColor}
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
                ><span style={convertStyle($s?.['ui.song.number'])}>{song.number}</span>
                <span class="pl-2" style={convertStyle($s?.['ui.song.title'])}>{song.title}</span
                ></button
            >
        {/each}
    </div>
</div>
