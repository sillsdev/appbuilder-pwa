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

    const tabIcons = import.meta.glob('./*', {
        eager: true,
        base: '/src/generatedAssets/icons/tabs'
    });

    const bookTabs = $derived(
        config?.bookCollections
            .find((x) => x.id === $refs.collection)
            ?.books.find((x) => x.id === $refs.book)?.bookTabs
    );

    function changeTab(newTab) {
        refs.setBookTab(newTab);
    }
    function getImageName(tabType) {
        return config?.tabTypes[tabType]?.images[0].file;
    }
    function getTabTypeName(tabType) {
        return (
            config?.tabTypes[tabType]?.name[$language] ||
            config?.tabTypes[tabType]?.name[languageDefault]
        );
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
                src={tabIcons[`./${getImageName(bookTabs.mainType)}`].default}
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
                    src={tabIcons[`./${getImageName(bookTab.type)}`].default}
                    color={$monoIconColor}
                    height="24"
                    width="24"
                    alt={getTabTypeName(bookTab.type)}
                />
            </picture>
        </button>
    {/each}
</div>
