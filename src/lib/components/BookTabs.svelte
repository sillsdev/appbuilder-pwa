<!--
@component
A component that displays the book tabs and allows the user to switch between them.
TODO:
- Determine which tab is selected and visually demonstrate that it is selected
- Switch tabs
-->
<script>
    import config from '$lib/data/config';
    import { refs, themeColors } from '$lib/data/stores';
    import MusicIcon from '$lib/icons/MusicIcon.svelte';
    import NotesIcon from '$lib/icons/NotesIcon.svelte';
    import QuestionsIcon from '$lib/icons/QuestionsIcon.svelte';
    import TextIcon from '$lib/icons/TextIcon.svelte';
    import VideoIcon from '$lib/icons/VideoIcon.svelte';

    let { curTab = 0 } = $props();
    const bookTabs = $derived(
        config?.bookCollections
            .find((x) => x.id === $refs.collection)
            .books.find((x) => x.id === $refs.book)?.bookTabs
    );
    const primaryColor = $state($themeColors.PrimaryColor);
    const icons = {
        T: TextIcon,
        Q: QuestionsIcon,
        N: NotesIcon,
        M: MusicIcon,
        V: VideoIcon
    };
    const MainIcon = $derived(icons[bookTabs.mainType]);
</script>

<div class="dy-tabs dy-tabs-border w-full">
    {#if curTab === 0}
        <div
            class="dy-tab text-center dy-btn rounded-none border-primary border-b-5 border-x-0 border-t-0"
        >
            <MainIcon color={primaryColor}></MainIcon>
        </div>
    {:else}
        <div class="dy-tab text-center dy-btn rounded-none">
            <MainIcon color={primaryColor}></MainIcon>
        </div>
    {/if}
    {#each bookTabs.tabs as bookTab, i}
        {@const Icon = icons[bookTab.type]}
        {#if curTab === i + 1}
            <div
                class="dy-tab text-center dy-btn rounded-none border-primary border-b-5 border-x-0 border-t-0"
            >
                <Icon color={primaryColor}></Icon>
            </div>
        {:else}
            <div class="dy-tab text-center dy-btn rounded-none">
                <Icon color={primaryColor}></Icon>
            </div>
        {/if}
    {/each}
    <!--
    <div class="dy-tab text-center dy-btn rounded-none">Tab 2</div>
    <div class="dy-tab text-center dy-btn rounded-none">Tab 3</div>
-->
</div>
