<script>
    import { page } from '$app/stores';
    import Navbar from '$lib/components/Navbar.svelte';
    import { t } from '$lib/data/stores';
    import { base } from '$app/paths';
    import { refs } from '$lib/data/stores';
    import { goto } from '$app/navigation';
    import { modal, MODAL_COLLECTION } from '$lib/data/stores';

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

            //there is also an example quiz, but I don't think it's ready?
            //currently the linkType for that is reference

            default:
            //type not handled
        }
    }

    // function formatReferenceTarget(linkTarget) {
    //     const str = linkTarget;
    //     const reference = str.split('.')
    //     //this is the seperate sections, they could be undefined
    //     // console.log(reference[0]); //book
    //     // console.log(reference[1]); //chapter
    //     // console.log(reference[2]); //verse

    //     return reference;

    // }

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

    //what to define target as? I don't think I'm understanding this
    //- this is from the HistoryCard.svelte file

    // $: bc = config.bookCollections.find((x) => x.id === target.collection);
    // $: docSet = bc.languageCode + '_' + bc.id;
    // $: bcName = config.bookCollections.length == 1 ? null : bc.collectionName;
    // $: bookName = bc.books.find((x) => x.id === target.book)?.name;
    // $: chapterVerseSeparator = bc.features['ref-chapter-verse-separator'];
    // $: reference = target.verse
    //     ? target.chapter + chapterVerseSeparator + target.verse
    //     : target.chapter;
    // $: textDirection = bc.style.textDirection;
</script>

<!-- list of current issues: (approximate lines)
    getting the link to go somewhere - line 32
    style of the link? - 32
    pictures showing up (src) - 50 - solved
    order - where should subtitle go? - 81
    features in the json - autocorrecting/prettifying? to thing - thing instead of thing-thing in the naming - 76
-->
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
        <div id="container" class="contents">
            {#each $page.data.items as item}
                <!-- iterate through the items, add html -->

                <!--need a way to get the link, onclick, and style
                is launch action supposed to be href stuff?-->

                <!--potential targets:
                    scripture
                    about
                    settings
                    other screens
                
                looking at the xml for the other project (having trouble getting it on my code)
                there are location = about etc. and then target = MAT. etc.
                
                for reference type, target = verse
                for screen, target = number of screen
                for other, location = about etc.
                for other, location = website and target = link to website
            
                NEED TO GET THE OTHER EXAMPLE/JSON INTO MY CODE TO WORK ON
                -->

                <!-- on:click={() =>xs
                    refs.set({
                        docSet,
                        book: item.linkTarget.book,
                        chapter: item.linkTarget.chapter,
                        verse: item.linkTarget.verse
                    })} -->

                <!-- svelte-ignore a11y-no-static-element-interactions -->
                <!-- svelte-ignore a11y-click-events-have-key-events -->
                <div class="contents-item-block" id={item.id} on:click={clicked(item)}>
                    <!--check for the various elements in the item-->
                    <!--
                    options:
                        image
                        title
                        subtitle
                        references (linkType: reference) (linkTarget = actual reference)
                        is there anything to do about features in the json?
                    -->

                    {#if item.imageFilename}
                        <div class="contents-image-block">
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
                        {#if item.title.default === undefined}
                            <!--empty-->
                        {:else}
                            <div class="contents-title">{item.title.default}</div>
                        {/if}

                        <!--Check for subtitle-->
                        {#if item.subtitle.default === undefined}
                            <!--empty-->
                            <!--the below only works if you alter the json? svelte keeps changing show-subtitles to show - subtitles 
                                this needs to be implemented for all of the options (I was testing with this one because it is the
                                one that is false)-->
                        {:else if item.features.showSubtitles === true}
                            <div class="contents-subtitle">{item.subtitle.default}</div>
                        {/if}

                        <!--check for reference - should this go before the subtitle?-->
                        {#if item.linkType === 'reference'}
                            <div class="contents-ref">{item.linkTarget}</div>
                        {:else}
                            <!--empty-->
                        {/if}
                    </div>
                </div>
            {/each}
        </div>
    </div>
</div>
