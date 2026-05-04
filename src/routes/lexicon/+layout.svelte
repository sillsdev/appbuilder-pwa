<script lang="ts">
    import { page } from '$app/state';
    import Navbar from '$lib/components/Navbar.svelte';
    import config from '$lib/data/config';
    import { t } from '$lib/data/stores';
    import { selectedWord, selectWord } from '$lib/data/stores/lexicon.svelte';
    import SearchIcon from '$lib/icons/SearchIcon.svelte';
    import { gotoRoute } from '$lib/navigate';
    import type { Snippet } from 'svelte';
    import type { LayoutData } from './$types';

    interface Props {
        children?: Snippet;
        data: LayoutData;
    }

    let { children }: Props = $props();

    const inSearchRoute = $derived(page.route.id.endsWith('/search'));
</script>

<div
    class="flex flex-col fixed bg-base-100 h-screen w-screen"
    style="background-color: var(--BackgroundColor); color: var(--TextColor);"
>
    <Navbar
        showBackButton={inSearchRoute || !!selectedWord.value}
        backNavigation={() => {
            if (selectedWord.value) {
                selectWord(null);
            } else {
                gotoRoute('/lexicon');
            }
        }}
    >
        {#snippet start()}
            <label for="sidebar">
                <div class="dy-btn dy-btn-ghost normal-case text-xl text-white font-bold pl-1">
                    {inSearchRoute ? $t['Menu_Search'] : config.name}
                </div>
            </label>
        {/snippet}
        {#snippet end()}
            <div class="flex flex-nowrap">
                <div id="extraButtons">
                    <button
                        class="dy-btn dy-btn-ghost dy-btn-circle"
                        onclick={() => {
                            gotoRoute(`/lexicon/search`).then(() => selectWord(null));
                        }}
                    >
                        <SearchIcon color="white" />
                    </button>
                </div>
            </div>
        {/snippet}
    </Navbar>
    {@render children?.()}
</div>
