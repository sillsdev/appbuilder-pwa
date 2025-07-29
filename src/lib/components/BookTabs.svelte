<!--
@component
A component that displays the book tabs and allows the user to switch between them.
TODO:
- Determine which tab is selected and visually demonstrate that it is selected
- Switch tabs
-->
<script>
    import config from '$lib/data/config';
    import { convertStyle, monoIconColor, refs, s } from '$lib/data/stores';
    import MusicIcon from '$lib/icons/MusicIcon.svelte';
    import NotesIcon from '$lib/icons/NotesIcon.svelte';
    import QuestionsIcon from '$lib/icons/QuestionsIcon.svelte';
    import TextIcon from '$lib/icons/TextIcon.svelte';
    import VideoIcon from '$lib/icons/VideoIcon.svelte';

    const bookTabs = $derived(
        config?.bookCollections
            .find((x) => x.id === $refs.collection)
            ?.books.find((x) => x.id === $refs.book)?.bookTabs
    );
    const icons = {
        T: TextIcon,
        Q: QuestionsIcon,
        N: NotesIcon,
        M: MusicIcon,
        V: VideoIcon
    };
    const MainIcon = $derived(icons[bookTabs.mainType]);

    function changeTab(newTab) {
        refs.setBookTab(newTab);
    }
</script>

<div class="dy-tabs dy-tabs-bordered mx-auto max-w-screen-md w-full">
    <button
        class="dy-tab {$refs.bookTab === 0 || $refs.bookTab === undefined ? 'dy-tab-active' : ''}"
        onclick={() => changeTab(0)}
        style={convertStyle($s['ui.book.tabs'])}
    >
        <MainIcon color={$monoIconColor}></MainIcon>
    </button>
    {#each bookTabs.tabs as bookTab, i}
        {@const Icon = icons[bookTab.type]}
        <button
            class="dy-tab {$refs.bookTab === i + 1 ? 'dy-tab-active' : ''} "
            onclick={() => changeTab(i + 1)}
            style={convertStyle($s['ui.book.tabs'])}
        >
            <Icon color={$monoIconColor}></Icon>
        </button>
    {/each}
</div>
