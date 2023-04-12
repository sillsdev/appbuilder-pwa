<!--
@component
The navbar component.
-->
<script>
    import Dropdown from './Dropdown.svelte';
    import SelectGrid from './SelectGrid.svelte';
    import TabsMenu from './TabsMenu.svelte';
    import { refs, nextRef, s, t, convertStyle, userSettings } from '$lib/data/stores';
    import { DropdownIcon } from '$lib/icons';
    import { catalog } from '$lib/data/catalog';
    import config from '$lib/data/config';

    /**reference to chapter selector so code can use TabsMenu.setActive*/
    let chapterSelector;

    // Needs testing, does updating the book correctly effect what chapters or verses are availible in the next tab?
    $: book = $nextRef.book === '' ? $refs.book : $nextRef.book;
    $: chapter = $nextRef.chapter === '' ? $refs.chapter : $nextRef.chapter;
    $: showVerseSelector = $userSettings['verse-selection'];

    $: c = $t.Selector_Chapter;
    $: v = $t.Selector_Verse;

    /**
     * Pushes reference changes to refs['next']. Pushes final change to default reference.
     */
    function navigateReference(e) {
        switch (e.detail.tab) {
            case c:
                $nextRef.chapter = e.detail.text;
                if (verseCount($nextRef.chapter) === 0 || !showVerseSelector) {
                    completeNavigation();
                } else {
                    bookSelector.setActive(v);
                }
                break;
            case v:
                completeNavigation();
                break;
            default:
                console.log('Chapter navigateReference: Default');
                break;
        }
    }

    function completeNavigation() {
        $refs.chapter = $nextRef.chapter;
        document.activeElement.blur();
    }

    function resetNavigation() {
        chapterSelector.setActive(c);
        nextRef.reset();
    }

    function chapterCount(book) {
        let books = catalog.find((d) => d.id === $refs.docSet).documents;
        let count = Object.keys(books.find((x) => x.bookCode === book).versesByChapters).length;
        return count;
    }

    function verseCount(book, chapter) {
        if (!chapter || chapter === 'i') {
            return 0;
        }
        let books = catalog.find((d) => d.id === $refs.docSet).documents;
        let chapters = books.find((d) => d.bookCode === book).versesByChapters;
        let count = Object.keys(chapters[chapter]).length;
        return count;
    }

    /**list of books in current docSet*/
    $: books = catalog.find((d) => d.id === $refs.docSet).documents;
    /**list of chapters in current book*/
    $: chapters = books.find((d) => d.bookCode === book).versesByChapters;
    $: showSelector =
        config.mainFeatures['show-chapter-number-on-app-bar'] && chapterCount($refs.book) > 0;
    const canSelect = config.mainFeatures['show-chapter-selector'];

    function chaptersContent(chapters) {
        let hasIntroduction = books.find((x) => x.bookCode === book).hasIntroduction;
        return {
            component: SelectGrid,
            props: {
                options: [
                    {
                        rows: hasIntroduction
                            ? [{ label: $t['Chapter_Introduction_Title'], id: 'i' }]
                            : null,
                        cells: Object.keys(chapters).map((x) => ({
                            label: x,
                            id: x
                        }))
                    }
                ]
            }
        };
    }

    function versesContent(chapters, chapter) {
        return {
            component: SelectGrid,
            props: {
                options: [
                    {
                        cells: Object.keys(chapters[chapter]).map((x) => ({
                            label: x,
                            id: x
                        }))
                    }
                ]
            }
        };
    }
</script>

<!-- Chapter Selector -->
{#if showSelector && ($nextRef.book === '' || $nextRef.chapter !== '')}
    <Dropdown on:nav-end={resetNavigation}>
        <svelte:fragment slot="label">
            <div class="normal-case" style={convertStyle($s['ui.selector.chapter'])}>
                {chapter}
            </div>
            {#if canSelect}
                <DropdownIcon color="white" />
            {/if}
        </svelte:fragment>
        <svelte:fragment slot="content">
            {#if canSelect}
                <div>
                    {(console.log('SHOW_VERSE_SELECTOR', showVerseSelector), '')}
                    {#if showVerseSelector}
                        <TabsMenu
                            bind:this={chapterSelector}
                            options={{
                                [c]: chaptersContent(chapters),
                                [v]: versesContent(chapters, chapter)
                            }}
                            active={c}
                            on:menuaction={navigateReference}
                        />
                    {:else}
                        <TabsMenu
                            bind:this={chapterSelector}
                            options={{
                                [c]: chaptersContent(chapters)
                            }}
                            active={c}
                            on:menuaction={navigateReference}
                        />
                    {/if}
                </div>
            {/if}
        </svelte:fragment>
    </Dropdown>
{/if}
