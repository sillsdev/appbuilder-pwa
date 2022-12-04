<!--
@component
The navbar component.
-->
<script>
    import Dropdown from './Dropdown.svelte';
    import SelectGrid from './SelectGrid.svelte';
    import TabsMenu from './TabsMenu.svelte';
    import { refs } from '$lib/data/stores';
    import { onDestroy } from 'svelte';
    import { DropdownIcon } from '$lib/icons';
    import { catalog } from '$lib/data/catalog';
    import config from '$lib/data/config';

    const verseAfterChapter = config.mainFeatures['show-verse-selector'];
    const chapterPopup = config.mainFeatures['show-chapter-selector'];

    /**reference to chapter selector so code can use TabsMenu.setActive*/
    let chapterSelector;

    let nextRef;
    const unsub = refs.subscribe((v) => {
        nextRef = v;
    }, 'next');
    /**
     * Pushes reference changes to refs['next']. Pushes final change to default reference.
     */
    function navigateReference(e) {
        switch (e.detail.tab) {
            case 'Chapter':
                if (!verseAfterChapter) {
                    chapterSelector.setActive('Chapter');
                    refs.set({ chapter: e.detail.text }, 'next');
                    $refs = { book: nextRef.book, chapter: nextRef.chapter };
                    document.activeElement.blur();
                    break;
                } else {
                    chapterSelector.setActive('Verse');
                    refs.set({ chapter: e.detail.text }, 'next');
                    break;
                }
            case 'Verse':
                if (!verseAfterChapter) {
                    break;
                } else {
                    chapterSelector.setActive('Chapter');
                    $refs = { book: nextRef.book, chapter: nextRef.chapter };
                    // force closes active dropdown elements
                    document.activeElement.blur();
                    break;
                }
            default:
                console.log('Chapter navigateReference: Default');
                break;
        }
    }

    /**list of books in current docSet*/
    $: books = catalog.find((d) => d.id === nextRef.docSet).documents;
    /**list of chapters in current book*/
    $: chapters = books.find((d) => d.bookCode === nextRef.book).versesByChapters;

    onDestroy(unsub);
</script>

<!-- Chapter Selector -->
{#if config.mainFeatures['show-chapter-number-on-app-bar']}
    <Dropdown>
        <svelte:fragment slot="label">
            {$refs.chapter}
            {#if chapterPopup}
                <DropdownIcon _class="fill-white" />
            {/if}
        </svelte:fragment>
        <svelte:fragment slot="content">
            {#if chapterPopup}
                <TabsMenu
                    bind:this={chapterSelector}
                    options={{
                        Chapter: {
                            component: SelectGrid,
                            props: { options: Object.keys(chapters) }
                        },
                        Verse: {
                            component: SelectGrid,
                            props: { options: Object.keys(chapters[nextRef.chapter]) }
                        }
                    }}
                    active="Chapter"
                    on:menuaction={navigateReference}
                />
            {/if}
        </svelte:fragment>
    </Dropdown>
{/if}
