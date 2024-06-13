<script>
    import { page } from '$app/stores';
    import Navbar from '$lib/components/Navbar.svelte';
    import { s, t, themeColors, modal, MODAL_COLLECTION, convertStyle } from '$lib/data/stores';
    import { base } from '$app/paths';
    import { refs } from '$lib/data/stores';
    import { goto } from '$app/navigation';

    $: highlightColor = $themeColors['ContentsItemTouchColor'];

    function onClick(event, item) {
        event.target.style.background = highlightColor;
        setTimeout(() => {
            clicked(item);
        }, 100);
    }

    function checkImageSize(item) {
        if (item.features['image-width']) {
            console.log(item.features['image-width']);
            return 'width: ' + item.features['image-width'];
        } else {
            //nothing here - default size
        }
    }
    function clicked(item) {
        //check type of link
        switch (item.linkType) {
            //reference linkType
            case 'reference':
                setReference(item);
                goto(`${base}/`);
                break;
            //need to check if these are the correct strings to use
            case 'screen':
                //not handled yet
                //goes to another contents page
                goto(`${base}/contents/${item.linkTarget}`);
                break;
            case 'other':
                //not handled yet
                //switch on item.linkLocation
                switch (item.linkLocation) {
                    case 'about':
                    case 'settings':
                        goto(`${base}/${item.linkLocation}`);
                        break;
                    case 'layout':
                        modal.open(MODAL_COLLECTION);
                        //also the title for this one says &amp; instead of & in the json
                        break;
                    case 'website':
                        //opens in a separate tab
                        window.open(`${item.linkTarget}`, '_blank');
                        break;
                }
                break;

            default:
                // For other book types (e.g. quiz), the linkType will be
                // the book type and the linkLocation will have the route
                // to the viewer of the book type.
                goto(`${base}/${item.linkLocation}`);
                break;
        }
    }

    function setReference(item) {
        // reference = formatReferenceTarget(item.linkTarget)
        let book;
        let chapter;
        let verse;
        const reference = item.linkTarget.split('.');

        switch (reference.length) {
            case 1:
                book = reference[0];
                break;
            case 2:
                book = reference[0];
                chapter = reference[1];
                break;
            case 3:
                book = reference[0];
                chapter = reference[1];
                verse = reference[2];
                break;
            default:
                break;
        }
        refs.set({
            book: book,
            chapter: chapter,
            verse: verse
        });
    }
</script>

<div class="grid grid-rows-[auto,1fr]" style="height:100vh;height:100dvh;">
    <div class="navbar">
        <Navbar>
            <!-- <div slot="left-buttons" /> -->
            <label for="sidebar" slot="center">
                <div class="btn btn-ghost normal-case text-xl">{$t['Menu_Contents']}</div>
            </label>
            <!-- <div slot="right-buttons" /> -->
        </Navbar>
    </div>

    <div class="overflow-y-auto mx-auto max-w-screen-md">
        <div id="container" class="contents" style={convertStyle($s['body.contents'])}>
            {#each $page.data.items as item}
                <!-- iterate through the items, add html -->

                <a
                    href="#"
                    class="contents-link contents-link-ref"
                    on:click={(event) => onClick(event, item)}
                >
                    <div class="contents-item-block" id={item.id}>
                        <!--check for the various elements in the item-->

                        {#if item.imageFilename}
                            <div
                                class="contents-image-block"
                                style="{convertStyle(
                                    $s['div.contents-image-block']
                                )}{checkImageSize(item)}"
                            >
                                <img
                                    class="contents-image"
                                    src="{base}/illustrations/{item.imageFilename}"
                                    alt={item.imageFilename}
                                />
                            </div>
                        {:else}
                            <!--empty - no image-->
                        {/if}

                        <div class="contents-text-block">
                            <!-- check for title -->
                            {#if $page.data.features['show-titles'] === true}
                                {#if item.title.default === undefined}
                                    <!--empty-->
                                {:else}
                                    <div class="contents-title">{item.title.default}</div>
                                {/if}
                            {/if}

                            <!--Check for subtitle-->
                            {#if $page.data.features['show-subtitles'] === true}
                                {#if item.subtitle.default === undefined}
                                    <!--empty-->
                                {:else}
                                    <div class="contents-subtitle">{item.subtitle.default}</div>
                                {/if}
                            {/if}

                            <!--check for reference - should this go before the subtitle?-->
                            {#if $page.data.features['show-references'] === true}
                                {#if item.linkType === 'reference'}
                                    <div class="contents-ref">{item.linkTarget}</div>
                                {:else}
                                    <!--empty-->
                                {/if}
                            {/if}
                        </div>
                    </div>
                </a>
            {/each}
        </div>
    </div>
</div>
