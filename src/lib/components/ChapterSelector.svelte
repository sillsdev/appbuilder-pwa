<!--
@component
The navbar component.
-->
<script>
    import Dropdown from './Dropdown.svelte';
    import SelectGrid from './SelectGrid.svelte';
    import TabsMenu from './TabsMenu.svelte';
    import { refs, s, t, convertStyle } from '$lib/data/stores';
    import { onDestroy } from 'svelte';
    import { DropdownIcon } from '$lib/icons';
    import { catalog } from '$lib/data/catalog';
    import config from '$lib/data/config';
    import { clickOutside } from '$lib/scripts/click_outside';

    /**reference to chapter selector so code can use TabsMenu.setActive*/
    let chapterSelector;

    $: c = $t.Selector_Chapter;
    $: v = $t.Selector_Verse;

    let nextRef;
    const unsub = refs.subscribe((v) => {
        nextRef = v;
    }, 'next');
    /**
     * Pushes reference changes to refs['next']. Pushes final change to default reference.
     */
    function navigateReference(e) {
        switch (e.detail.tab) {
            case c:
                chapterSelector.setActive(v);
                refs.set({ chapter: e.detail.text }, 'next');
                console.log("Chapter set chapter to: ", e.detail.text);
                break;
            case v:
                chapterSelector.setActive(c);
                $refs = { chapter: nextRef.chapter };
                console.log("But in chapter its really", nextRef.chapter);
                // force closes active dropdown elements
                document.activeElement.blur();
                break;
            default:
                console.log('Chapter navigateReference: Default');
                break;
        }
    }

    /**list of books in current docSet*/
    $: books = catalog.find((d) => d.id === nextRef.docSet).documents;
    /**list of chapters in current book*/
    $: chapters = books.find((d) => d.bookCode === nextRef.book).versesByChapters;
    const showSelector = config.mainFeatures['show-chapter-number-on-app-bar'];
    const canSelect = config.mainFeatures['show-chapter-selector'];

    onDestroy(unsub);
</script>

<!-- Chapter Selector -->
{#if showSelector}
    <Dropdown>
        <svelte:fragment slot="label">
            <div style={convertStyle($s['ui.selector.chapter'])}>
                {nextRef.chapter}
            </div>
            {#if canSelect}
                <DropdownIcon color="white" />
            {/if}
        </svelte:fragment>
        <svelte:fragment slot="content">
            {#if canSelect}
                <div use:clickOutside
                on:outclick={() => {
                    chapterSelector.setActive(c);
                    refs.set({ chapter: $refs.chapter }, 'next');
                }}
                style:background-color="white"
            >
                    <TabsMenu
                        bind:this={chapterSelector}
                        options={{
                            [c]: {
                                component: SelectGrid,
                                props: {
                                    options: [
                                        {
                                            cells: Object.keys(chapters).map((x) => ({
                                                label: x,
                                                id: x
                                            }))
                                        }
                                    ]
                                }
                            },
                            [v]: {
                                component: SelectGrid,
                                props: {
                                    options: [
                                        {
                                            cells: Object.keys(chapters[nextRef.chapter]).map(
                                                (x) => ({
                                                    label: x,
                                                    id: x
                                                })
                                            )
                                        }
                                    ]
                                }
                            }
                        }}
                        active={c}
                        on:menuaction={navigateReference}
                    />
                </div>
            {/if}
        </svelte:fragment>
    </Dropdown>
{/if}
