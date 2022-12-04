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

    const chapterAfterBookSelector = config.mainFeatures['show-chapter-selector-after-book'];
    const verseAfterChapter = config.mainFeatures['show-verse-selector'];

    let bookSelector;

    let nextRef;
    const unsub = refs.subscribe((v) => {
        nextRef = v;
    }, 'next');
    /**
     * Pushes reference changes to refs['next']. Pushes final change to default reference.
     */
    function navigateReference(e) {
        switch (e.detail.tab) {
            case 'Book':
                // Chapter after book selector False
                if (!chapterAfterBookSelector) {
                    bookSelector.setActive('Book');
                    refs.set({ book: e.detail.text }, 'next');
                    $refs = { book: nextRef.book, chapter: '1' };
                    document.activeElement.blur();
                    break;
                }
                // Verse after chapter selector False
                else if (!verseAfterChapter) {
                    bookSelector.setActive('Chapter');
                    refs.set({ book: e.detail.text }, 'next');
                    break;
                } else {
                    bookSelector.setActive('Chapter');
                    refs.set({ book: e.detail.text }, 'next');
                    break;
                }

            case 'Chapter':
                // Chapter after book selector False
                if (!chapterAfterBookSelector) {
                    break;
                }
                // Verse after chapter selector False
                else if (!verseAfterChapter) {
                    bookSelector.setActive('Chapter');
                    refs.set({ chapter: e.detail.text }, 'next');
                    $refs = { book: nextRef.book, chapter: nextRef.chapter };
                    document.activeElement.blur();
                    break;
                } else {
                    bookSelector.setActive('Verse');
                    refs.set({ chapter: e.detail.text }, 'next');
                    break;
                }

            case 'Verse':
                if (!chapterAfterBookSelector) {
                    break;
                } else if (!verseAfterChapter) {
                    break;
                } else {
                    bookSelector.setActive('Book');
                    $refs = { book: nextRef.book, chapter: nextRef.chapter };
                    // force closes active dropdown elements
                    document.activeElement.blur();
                    break;
                }

            default:
                console.log('Book navigateReference: Default');
                break;
        }
    }

    /**list of books in current docSet*/
    $: books = catalog.find((d) => d.id === nextRef.docSet).documents;
    /**list of chapters in current book*/
    $: chapters = books.find((d) => d.bookCode === nextRef.book).versesByChapters;

    onDestroy(unsub);
</script>

<!-- Book Selector -->
{#if config.mainFeatures['book-select'] === 'grid'}
    <Dropdown>
        <svelte:fragment slot="label">
            {$refs.book}
            <DropdownIcon _class="fill-white" />
        </svelte:fragment>
        <svelte:fragment slot="content">
            <TabsMenu
                bind:this={bookSelector}
                options={{
                    Book: {
                        component: SelectGrid,
                        /**
                         * TODO:
                         * - add book abbreviations to catalog to be used in UI instead of bookCode
                         */
                        props: { options: books.map((b) => b.bookCode) /*bookAbbreviations*/ }
                    },
                    Chapter: {
                        component: SelectGrid,
                        props: { options: Object.keys(chapters) }
                    },
                    Verse: {
                        component: SelectGrid,
                        props: { options: Object.keys(chapters[nextRef.chapter]) }
                    }
                }}
                active="Book"
                on:menuaction={navigateReference}
            />
        </svelte:fragment>
    </Dropdown>
{:else if config.mainFeatures['book-select'] === 'list'}
    <!--TODO: Add List selector -->
{/if}
