<script lang="ts">
    import { goto } from '$app/navigation';
    import { page } from '$app/state';
    import config from '$assets/config';
    import Navbar from '$lib/components/Navbar.svelte';
    import { showTextAppearance } from '$lib/components/TextAppearanceSelector.svelte';
    import { actionBarColor, fontChoices, modal, ModalType, t } from '$lib/data/stores';
    import { selectedWord, selectWord } from '$lib/data/stores/lexicon.svelte';
    import SearchIcon from '$lib/icons/SearchIcon.svelte';
    import TextAppearanceIcon from '$lib/icons/TextAppearanceIcon.svelte';
    import { resolve } from '$lib/utils/paths';
    import type { Snippet } from 'svelte';
    import type { LayoutData } from './$types';

    interface Props {
        children?: Snippet;
        data: LayoutData;
    }

    let { children, data: _data }: Props = $props();

    const inSearchRoute = $derived(page.route.id?.endsWith('/search'));
</script>

<div
    class="flex flex-col fixed bg-base-100 h-screen w-screen"
    style="background-color: var(--BackgroundColor); color: var(--TextColor);"
>
    <Navbar
        showBackButton={inSearchRoute || !!selectedWord.value}
        backNavigation={() => {
            if (selectedWord.value) {
                selectWord(null, !inSearchRoute);
            } else {
                goto(resolve('/lexicon'));
            }
        }}
    >
        {#snippet start()}
            <label for="sidebar">
                <div
                    class="dy-btn dy-btn-ghost normal-case text-xl font-bold pl-1"
                    style:color={$actionBarColor}
                >
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
                            goto(resolve(`/lexicon/search`)).then(() => selectWord(null));
                        }}
                    >
                        <SearchIcon color={$actionBarColor} />
                    </button>
                    {#if showTextAppearance($fontChoices)}
                        <button
                            class="dy-btn dy-btn-ghost dy-btn-circle"
                            onclick={() => modal.open(ModalType.TextAppearance)}
                        >
                            <TextAppearanceIcon color={$actionBarColor} />
                        </button>
                    {/if}
                </div>
            </div>
        {/snippet}
    </Navbar>
    {@render children?.()}
</div>
