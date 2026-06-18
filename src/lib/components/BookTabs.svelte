<!--
@component
A component that displays the book tabs and allows the user to switch between them.
-->
<script lang="ts">
    import { scriptureConfig } from '$assets/config';
    import { convertStyle, language, monoIconColor, refs, s, theme } from '$lib/data/stores';

    const tabIcons = import.meta.glob('./*', {
        import: 'default',
        eager: true,
        query: '?url',
        base: '/src/gen-assets/icons/tabs'
    }) as Record<string, string>;

    const bookTabs = $derived(
        scriptureConfig.bookCollections
            ?.find((x) => x.id === $refs.collection)
            ?.books.find((x) => x.id === $refs.book)?.bookTabs
    );

    function changeTab(newTab: number) {
        refs.setBookTab(newTab);
    }
    function getImageName(tabType?: string) {
        return (tabType && scriptureConfig.tabTypes?.[tabType]?.images?.[0]?.file) || '';
    }
    function getTabTypeName(tabType?: string) {
        return scriptureConfig.tabTypes?.[tabType ?? '']?.name?.[$language];
    }
</script>

<div class="dy-tabs dy-tabs-bordered mx-auto max-w-(--breakpoint-md) w-full">
    <button
        class="dy-tab {$refs.bookTab === 0 || $refs.bookTab === undefined ? 'dy-tab-active' : ''}"
        onclick={() => changeTab(0)}
        style={convertStyle($s?.['ui.book.tabs'])}
    >
        <picture class:invert={$theme === 'Dark'}>
            <img
                src={tabIcons[`./${getImageName(bookTabs?.mainType)}`]}
                color={$monoIconColor}
                height="24"
                width="24"
                alt={getTabTypeName(bookTabs?.mainType)}
            />
        </picture>
    </button>
    {#each bookTabs?.tabs as bookTab, i}
        <button
            class="dy-tab {$refs.bookTab === i + 1 ? 'dy-tab-active' : ''} "
            onclick={() => changeTab(i + 1)}
            style={convertStyle($s?.['ui.book.tabs'])}
        >
            <picture class:invert={$theme === 'Dark'}>
                <img
                    src={tabIcons[`./${getImageName(bookTab.type)}`]}
                    color={$monoIconColor}
                    height="24"
                    width="24"
                    alt={getTabTypeName(bookTab.type)}
                />
            </picture>
        </button>
    {/each}
</div>
