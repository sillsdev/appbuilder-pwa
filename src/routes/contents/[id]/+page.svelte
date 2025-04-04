<script>
    import { goto } from '$app/navigation';
    import { base } from '$app/paths';
    import { page } from '$app/stores';
    import BottomNavigationBar from '$lib/components/BottomNavigationBar.svelte';
    import Navbar from '$lib/components/Navbar.svelte';
    import { loadCatalog } from '$lib/data/catalogData';
    import config from '$lib/data/config';
    import {
        contentsFontSize,
        contentsStack,
        convertStyle,
        language,
        modal,
        MODAL_COLLECTION,
        MODAL_TEXT_APPEARANCE,
        refs,
        s,
        t,
        themeColors
    } from '$lib/data/stores';
    import { AudioIcon, TextAppearanceIcon } from '$lib/icons';
    import { getRoute, navigateToText } from '$lib/navigate';
    import { getDisplayString } from '$lib/scripts/scripture-reference-utils';
    import { compareVersions, pathJoin } from '$lib/scripts/stringUtils';

    const imageFolder =
        compareVersions(config.programVersion, '12.0') < 0 ? 'illustrations' : 'contents';
    const audioFolder = compareVersions(config.programVersion, '12.0') < 0 ? 'assets' : 'contents';
    $: highlightColor = $themeColors['ContentsItemTouchColor'];
    $: title = setTitle($page);

    function playAudio(event, item) {
        event.stopPropagation();
        //assign/use the proper filename
        const filename = item.audioFilename[$language] ?? item.audioFilename.default;

        let audio = new Audio();
        audio.src = `${base}/${audioFolder}/${filename}`;
        audio.play();
    }

    function onClick(event, item) {
        event.target.style.background = highlightColor;
        setTimeout(() => {
            //navigate
            clicked(item);
        }, 100);
    }

    function checkImageSize(item) {
        if (item.features['image-width']) {
            return 'width: ' + item.features['image-width'];
        }
    }
    async function clicked(item) {
        //check type of link
        switch (item.linkType) {
            //reference linkType
            case 'reference':
                contentsStack.pushItem($page.data.menu.id);
                const contentsRef = await getReference(item);
                await navigateToText(contentsRef);
                break;
            case 'screen':
                //goes to another contents page
                contentsStack.pushItem($page.data.menu.id);
                await goto(getRoute(`/contents/${item.linkTarget}`));
                break;
            case 'other':
                //switch on item.linkLocation
                switch (item.linkLocation) {
                    case 'about':
                    case 'settings':
                        goto(getRoute(`/${item.linkLocation}`));
                        break;
                    case 'layout':
                        modal.open(MODAL_COLLECTION);
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
                goto(getRoute(`/${item.linkLocation}`));
                break;
        }
    }

    async function getReference(item) {
        let docSet = $refs.docSet;
        let collection = docSet.split('_')[1];
        let book;
        let chapter;
        let verse;
        const reference = item.linkTarget.split('.');
        if (item.layoutMode && item.layoutCollection?.length > 0) {
            /* 
            Note: have not handled layout modes
            layoutMode options:
                single
                two
                verse-by-verse
            */
            collection = item.layoutCollection[0];
            docSet =
                config.bookCollections.find((x) => x.id === collection).languageCode +
                '_' +
                collection;
        }
        switch (reference.length) {
            case 1:
                book = reference[0];
                chapter = await firstChapter(book, docSet);
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
        return {
            docSet,
            collection,
            book,
            chapter,
            verse
        };
    }
    let referenceTexts = new Map();
    async function loadReferenceText(item) {
        if (!referenceTexts.has(item)) {
            referenceTexts.set(item, await getReferenceText(item));
        }
        return referenceTexts.get(item);
    }
    async function getReferenceText(item) {
        const reference = await getReference(item);
        let currentBookCollectionId = $refs.collection;
        let collection = reference.collection ?? currentBookCollectionId;
        const verse = reference.verse ? parseInt(reference.verse) : -1;
        // Get the reference text.  Contents references may contain a collection,
        // will contain a book and maybe a chapter and maybe a verse.  The getDisplayString
        // method is setup to handle multiple verse ranges in a single reference even though
        // that is not needed in this case.  Here, the verse is either the verse number of the
        // reference or -1 if there is no verse number. The -1 indicates that it is a single
        // verse, not a range, and the '-' is a verse range separator which is not used in this
        // case.
        const referenceText = getDisplayString(collection, reference.book, reference.chapter, [
            [verse, -1, '-']
        ]);
        return referenceText;
    }
    //set the title for the current contents page
    function setTitle(page) {
        //checks title type and returns the appropriate title or lack of title
        let title = '';
        switch (page.data.features['title-type']) {
            case 'app-name':
                title = config.name;
                break;
            case 'screen':
                title = page.data.menu.title[$language] ?? page.data.menu.title.default ?? '';
                break;
            case 'custom':
                title = page.data.title[$language] ?? page.data.title.default ?? '';
                break;
            case 'none':
            default:
                break;
        }
        return title;
    }

    function backNavigation() {
        if ($contentsStack.length > 0) {
            const menuId = contentsStack.popItem();
            goto(getRoute(`/contents/${menuId}`));
        }
    }
    async function firstChapter(book, docset) {
        let first = '1';
        if (docset === currentDocSet) {
            first = Object.keys(books.find((x) => x.bookCode === book).versesByChapters)[0];
        } else {
            let docSetCatalog = await loadCatalog(docset);
            let docSetBooks = docSetCatalog.documents;
            first = Object.keys(docSetBooks.find((x) => x.bookCode === book).versesByChapters)[0];
        }
        return first;
    }
    $: books = $refs.catalog.documents;
    $: currentDocSet = $refs.docSet;
    $: showBackButton = $contentsStack.length > 0;
    const bottomNavBarEnabled = config?.bottomNavBarItems && config?.bottomNavBarItems.length > 0;
    const barType = 'contents';
</script>

<div class="grid grid-rows-[auto,1fr]" style="height:100vh;height:100dvh;">
    <div class="navbar">
        <Navbar {backNavigation} {showBackButton}>
            <!-- <div slot="left-buttons" /> -->
            {#snippet center()}
                <label for="sidebar" slot="center">
                    <div class="btn btn-ghost normal-case text-xl">{title}</div>
                </label>
            {/snippet}

            {#snippet end()}
                <div class="flex items-center">
                    <div class="flex">
                        {#if $page.data.features['show-text-size-button'] === true}
                            <!-- svelte-ignore a11y-click-events-have-key-events -->
                            <!-- svelte-ignore a11y-label-has-associated-control -->
                            <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
                            <label
                                class="dy-btn dy-btn-ghost p-0.5 dy-no-animation"
                                on:click={() =>
                                    modal.open(MODAL_TEXT_APPEARANCE, { contentsMode: true })}
                            >
                                <TextAppearanceIcon color="white" />
                            </label>
                        {/if}
                    </div>
                </div>
            {/snippet}
        </Navbar>
    </div>

    <div class="overflow-y-auto mx-auto max-w-screen-md">
        <div id="container" class="contents" style={convertStyle($s['body.contents'])}>
            {#each $page.data.items as item}
                <!-- iterate through the items, adding html -->

                <!-- svelte-ignore a11y-click-events-have-key-events -->
                <!-- svelte-ignore a11y-no-static-element-interactions -->
                <div
                    class="contents-item-block contents-link-ref"
                    id={item.id}
                    on:click={(event) => onClick(event, item)}
                >
                    <!--check for the various elements in the item-->
                    {#if item.audioFilename[$language] || item.audioFilename.default}
                        <!-- svelte-ignore a11y-click-events-have-key-events -->
                        <!-- svelte-ignore a11y-no-static-element-interactions -->
                        <div
                            class="contents-item-audio-image"
                            on:click={(event) => playAudio(event, item)}
                        >
                            <AudioIcon.Volume></AudioIcon.Volume>
                        </div>
                    {/if}

                    {#if item.imageFilename}
                        <div
                            class="contents-image-block"
                            style="{convertStyle($s['div.contents-image-block'])}{checkImageSize(
                                item
                            )}"
                        >
                            <img
                                class="contents-image"
                                src="{base}/{imageFolder}/{item.imageFilename}"
                                alt={item.imageFilename}
                            />
                        </div>
                    {/if}

                    <div class="contents-text-block" style:font-size="{$contentsFontSize}px">
                        <!-- check for title -->
                        {#if $page.data.features['show-titles'] === true}
                            <div class="contents-title">
                                {item.title[$language] ?? item.title.default ?? ''}
                            </div>
                        {/if}

                        <!--Check for subtitle-->
                        {#if $page.data.features['show-subtitles'] === true}
                            <div class="contents-subtitle">
                                {item.subtitle[$language] ?? item.subtitle.default ?? ''}
                            </div>
                        {/if}

                        <!--check for reference -->
                        {#if $page.data.features['show-references'] === true}
                            {#if item.linkType === 'reference'}
                                {#await loadReferenceText(item)}
                                    <div class="contents-ref"></div>
                                {:then referenceText}
                                    <div class="contents-ref">{referenceText}</div>
                                {:catch error}
                                    <div class="contents-ref"></div>
                                {/await}
                            {/if}
                        {/if}
                    </div>
                </div>
            {/each}
        </div>
    </div>
    {#if bottomNavBarEnabled}
        <BottomNavigationBar {barType} />
    {/if}
</div>
