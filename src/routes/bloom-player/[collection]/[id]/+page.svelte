<script lang="ts">
    import { beforeNavigate, goto, invalidateAll } from '$app/navigation';
    import { scriptureConfig } from '$assets/config';
    import contents from '$assets/contents';
    import type { BloomBook, BookCollectionConfig, ScriptureConfig } from '$config';
    import BloomPlayerElement from '$lib/components/BloomPlayerElement.svelte';
    import BookSelector from '$lib/components/BookSelector.svelte';
    import BottomNavigationBar from '$lib/components/BottomNavigationBar.svelte';
    import ChapterSelector from '$lib/components/ChapterSelector.svelte';
    import Navbar from '$lib/components/Navbar.svelte';
    import {
        actionBarColor,
        bodyFontSize,
        bodyLineHeight,
        contentsStack,
        convertStyle,
        language,
        modal,
        ModalType,
        moreThanOneCollection,
        NAVBAR_HEIGHT,
        s,
        showCollection,
        t
    } from '$lib/data/stores';
    import { refs } from '$lib/data/stores/scripture';
    import { compareVersions } from '$lib/scripts/stringUtils';
    import { resolve } from '$lib/utils/paths';
    import { onDestroy, onMount } from 'svelte';
    import type { Snippet } from 'svelte';
    import type { ClassValue } from 'svelte/elements';
    import type { PageData } from './$types';

    // TODO: Cleanup unused imports
    // TODO: Refactor and be sure these different functions are either wired in or removed
    interface Props {
        data: PageData;
        // showBackButton?: boolean;
        // start?: Snippet;
        // center?: Snippet;
        // end?: Snippet;
        // backNavigation?: (e: Event, routeId: string) => void;
    }

    let { data }: Props = $props();

    let showOverlowMenu = $state(false);
    function handleMenuClick() {
        showOverlowMenu = false;
    }
    const book = $derived(data.book);

    function backNavigation() {
        if ($contentsStack.length > 0) {
            const menuId = contentsStack.popItem();
            goto(resolve(`/contents/${menuId}`));
        }
    }

    const showBackButton = $derived(
        contents?.features?.['navigation-type'] === 'up' && $contentsStack.length > 0
    );

    let player;
    const bookUrl = $derived(
        encodeURI(
            `/src/gen-assets/collections/${data.collection}/${data.id}/${book?.hashedFileName ?? ''}`
        )
    );
    const lang = $derived.by(() => {
        // Intended as the fallback if main method of getting language name fails
        let result = data?.bookCollection?.languageCode ?? '';
        if (result.length > 0 && data.book?.bloomMeta?.languages) {
            for (const k of Object.entries(data.book.bloomMeta.languages)) {
                const key = k[0] as string;
                if (
                    data.book.bloomMeta.languages[key].name.toLowerCase() ===
                    data.bookCollection?.languageName?.toLowerCase()
                ) {
                    result = data.book.bloomMeta.languages[key].lang;
                }
            }
        }
        return result;
    });
</script>

<div class="h-screen">
    <BloomPlayerElement
        bind:this={player}
        playerUrl="/src/gen-assets/bloom-player/bloomplayer.htm"
        {bookUrl}
        {lang}
    />
</div>

<style>
    :global(bloom-player) {
        display: block;
        width: 100%;
        height: 100%;
    }
</style>
