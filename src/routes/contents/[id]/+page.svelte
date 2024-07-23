<script>
    import { page } from '$app/stores';
    import Navbar from '$lib/components/Navbar.svelte';
    import {
        language,
        s,
        t,
        themeColors,
        modal,
        MODAL_COLLECTION,
        convertStyle,
        contentsStack,
        MODAL_TEXT_APPERANCE,
        contentsFontSize
    } from '$lib/data/stores';
    import { compareVersions, pathJoin } from '$lib/scripts/stringUtils';
    import { base } from '$app/paths';
    import { refs } from '$lib/data/stores';
    import { navigateToText } from '$lib/navigate';
    import { goto } from '$app/navigation';
    import config from '$lib/data/config';
    import { AudioIcon, TextAppearanceIcon } from '$lib/icons';

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
                await navigateToText(getReference(item));
                break;
            case 'screen':
                //goes to another contents page
                contentsStack.pushItem($page.data.menu.id);
                await goto(`${base}/contents/${item.linkTarget}`);
                break;
            case 'other':
                //switch on item.linkLocation
                switch (item.linkLocation) {
                    case 'about':
                    case 'settings':
                        goto(`${base}/${item.linkLocation}`);
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
                goto(`${base}/${item.linkLocation}`);
                break;
        }
    }

    function getReference(item) {
        let docSet;
        let collection;
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
                chapter = '1';
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

    function handleBackNavigation(event) {
        event.preventDefault();
        if ($contentsStack.length > 0) {
            const menuId = contentsStack.popItem();
            goto(`${base}/contents/${menuId}`);
        }
    }
    $: showBackButton = $contentsStack.length > 0;
</script>

<div class="grid grid-rows-[auto,1fr]" style="height:100vh;height:100dvh;">
    <div class="navbar">
        <Navbar on:backNavigation={handleBackNavigation} {showBackButton}>
            <!-- <div slot="left-buttons" /> -->
            <label for="sidebar" slot="center">
                <div class="btn btn-ghost normal-case text-xl">{title}</div>
            </label>
            <div slot="right-buttons" class="flex items-center">
                <div class="flex">
                    {#if $page.data.features['show-text-size-button'] === true}
                        <!-- svelte-ignore a11y-click-events-have-key-events -->
                        <!-- svelte-ignore a11y-label-has-associated-control -->
                        <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
                        <label
                            class="dy-btn dy-btn-ghost p-0.5 dy-no-animation"
                            on:click={() =>
                                modal.open(MODAL_TEXT_APPERANCE, { contentsMode: true })}
                        >
                            <TextAppearanceIcon color="white" />
                        </label>
                    {/if}
                </div>
            </div>
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
                                <div class="contents-ref">{item.linkTarget}</div>
                            {/if}
                        {/if}
                    </div>
                </div>
            {/each}
        </div>
    </div>
</div>
