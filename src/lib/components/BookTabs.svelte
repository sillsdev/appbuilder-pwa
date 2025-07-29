<!--
@component
A component that displays the book tabs and allows the user to switch between them.
-->
<script>
    import { base } from '$app/paths';
    import config from '$lib/data/config';
    import {
        convertStyle,
        language,
        languageDefault,
        monoIconColor,
        refs,
        s,
        theme
    } from '$lib/data/stores';

    const bookTabs = $derived(
        config?.bookCollections
            .find((x) => x.id === $refs.collection)
            ?.books.find((x) => x.id === $refs.book)?.bookTabs
    );
    const MainIcon = $derived(icons[bookTabs.mainType]);

    function changeTab(newTab) {
        refs.setBookTab(newTab);
    }
    function getImageName(tabType) {
        let types = config?.tabTypes;
        for (let i = 0; i < types.length; i++) {
            if (types[i].id === tabType) {
                return types[i].images[0]?.file;
            }
        }
    }
    function getTabTypeName(tabType) {
        let types = config?.tabTypes;
        for (let i = 0; i < types.length; i++) {
            if (types[i].id === tabType) {
                return types[i].name[$language] || types[i].name[languageDefault];
            }
        }
    }
</script>

<div class="dy-tabs dy-tabs-bordered mx-auto max-w-screen-md w-full">
    <button
        class="dy-tab {$refs.bookTab === 0 || $refs.bookTab === undefined ? 'dy-tab-active' : ''}"
        onclick={() => changeTab(0)}
        style={convertStyle($s['ui.book.tabs'])}
    >
        <picture class:invert={$theme === 'Dark'}>
            <img
                src="{base}/icons/tabs/{getImageName(bookTabs.mainType)}"
                color={$monoIconColor}
                height="24"
                width="24"
                alt={getTabTypeName(bookTabs.mainType)}
            />
        </picture>
    </button>
    {#each bookTabs.tabs as bookTab, i}
        <button
            class="dy-tab {$refs.bookTab === i + 1 ? 'dy-tab-active' : ''} "
            onclick={() => changeTab(i + 1)}
            style={convertStyle($s['ui.book.tabs'])}
        >
            <picture class:invert={$theme === 'Dark'}>
                <img
                    src="{base}/icons/tabs/{getImageName(bookTab.type)}"
                    color={$monoIconColor}
                    height="24"
                    width="24"
                    alt={getTabTypeName(bookTab.type)}
                />
            </picture>
        </button>
    {/each}
</div>
