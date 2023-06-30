<!--
@component
Taken from modifying a copy of the AudioBar.svelte file
Enables users to copy, highlight, bookmark, share, and annotate selected verses.
TODO: 
- Implement functionality for
 -> Share
 -> Play
 -> Play Repeat
 -> Verse On Image
- Add note dialog
- Add highlight colors
-->
<script lang="ts">
    import {
        AudioIcon,
        CopyContentIcon,
        HighlightIcon,
        NoteIcon,
        BookmarkIcon,
        BookmarkOutlineIcon,
        ShareIcon
    } from '$lib/icons';
    import { ImageIcon } from '$lib/icons/image';
    import config from '$lib/data/config';
    import {
        t,
        s,
        refs,
        notes,
        selectedVerses,
        theme,
        themeColors,
        highlights,
        bookmarks
    } from '$lib/data/stores';
    import toast, { Toaster } from 'svelte-french-toast';
    import { addBookmark, findBookmark, removeBookmark } from '$lib/data/bookmarks';
    import { addHighlights, removeHighlights } from '$lib/data/highlights';
    import { addNote } from '$lib/data/notes';
    const isAudioPlayable = config?.mainFeatures['text-select-play-audio'];
    const isRepeatableAudio = config?.mainFeatures['audio-repeat-selection-button'];
    const isTextOnImageEnabled = config?.mainFeatures['text-on-image'];
    const isBookmarkEnabled = config?.mainFeatures['annotation-bookmarks'];
    const isHighlightEnabled = config?.mainFeatures['annotation-highlights'];
    const isNotesEnabled = config?.mainFeatures['annotation-notes'];

    let isHighlight = false;
    let selectedVerseInBookmarks = -1;
    let showHightlightPens = false;

    $: isCopyEnabled = config.bookCollections.find((x) => x.id === $refs.collection).features[
        'bc-allow-copy-text'
    ];
    $: isShareEnabled = config.bookCollections.find((x) => x.id === $refs.collection).features[
        'bc-allow-share-text'
    ];
    $: $selectedVerses, updateSelectedVerseInBookmarks($selectedVerses);
    $: buttonBorder = '1px solid ' + ($theme === 'Dark' ? '#FFFFFF' : '#888888');

    function selectedText() {
        var someText = $selectedVerses.reduce((text, v) => (text += v.text), '');
        return someText;
    }

    function selectedTextReference() {
        var scriptureReference =
            $selectedVerses[0]['book'] +
            ' ' +
            $selectedVerses[0]['chapter'] +
            ':' +
            $selectedVerses[0]['verse'];
        var extraVerses = '';
        for (var i = 1; i < $selectedVerses.length; i++) {
            extraVerses = extraVerses.concat(', ' + $selectedVerses[i]['verse']);
        }
        scriptureReference.concat(extraVerses);

        return scriptureReference;
    }

    async function updateSelectedVerseInBookmarks(selectedVerses) {
        selectedVerseInBookmarks = await findBookmark({
            collection: selectedVerses[0].collection,
            book: selectedVerses[0].book,
            chapter: selectedVerses[0].chapter,
            verse: selectedVerses[0].verse
        });
    }

    async function modifyBookmark() {
        // If there is already a bookmark at this verse, remove it
        if (selectedVerseInBookmarks === -1) {
            await addBookmark({
                collection: $selectedVerses[0].collection,
                book: $selectedVerses[0].book,
                chapter: $selectedVerses[0].chapter,
                verse: $selectedVerses[0].verse,
                text: selectedVerses.getVerseByIndex(0).text,
                reference: selectedVerses.getReference(0)
            });
        } else {
            await removeBookmark(selectedVerseInBookmarks);
        }

        await bookmarks.sync();
        selectedVerses.reset();
    }

    async function modifyNote() {
        await addNote({
            collection: $selectedVerses[0].collection,
            book: $selectedVerses[0].book,
            chapter: $selectedVerses[0].chapter,
            verse: $selectedVerses[0].verse,
            text: selectedVerses.getVerseByIndex(0).text,
            reference: selectedVerses.getReference(0)
        });

        await notes.sync();
        selectedVerses.reset();
    }

    async function modifyHighlight(numColor) {
        if (numColor == 6) {
            await removeHighlights($selectedVerses);
        } else {
            await addHighlights(numColor, $selectedVerses);
        }

        await highlights.sync();
        selectedVerses.reset();
    }

    function copy() {
        var copyText = selectedText() + '\n' + selectedVerses.getCompositeReference();
        navigator.clipboard.writeText(copyText);
        toast($t['Text_Copied'], {
            position: 'bottom-right'
        });
        selectedVerses.reset();
    }

    $: barBackgroundColor = $s['ui.bar.text-select']['background-color'];
    $: barIconColor = $s['ui.bar.text-select.icon']['color'];
</script>

<Toaster />
<div
    class="h-12 bg-base-100 mx-auto flex items-center flex-col"
    style:background-color={barBackgroundColor}
>
    <div class="flex flex-col justify-center w-11/12 flex-grow">
        <!-- Controls -->
        <div class="dy-btn-group place-self-center">
            {#if showHightlightPens}
                <div class="pen-grid grid grid-rows-1 gap-2 my-2">
                    <!-- svelte-ignore a11y-click-events-have-key-events -->
                    <div
                        class="dy-btn-sm"
                        style:background-color={$themeColors['HighlighterPenYellow']}
                        style:border={buttonBorder}
                        on:click={() => modifyHighlight(1)}
                    />
                    <!-- svelte-ignore a11y-click-events-have-key-events -->
                    <div
                        class="dy-btn-sm"
                        style:background-color={$themeColors['HighlighterPenGreen']}
                        style:border={buttonBorder}
                        on:click={() => modifyHighlight(2)}
                    />
                    <!-- svelte-ignore a11y-click-events-have-key-events -->
                    <div
                        class="dy-btn-sm"
                        style:background-color={$themeColors['HighlighterPenBlue']}
                        style:border={buttonBorder}
                        on:click={() => modifyHighlight(3)}
                    />
                    <!-- svelte-ignore a11y-click-events-have-key-events -->
                    <div
                        class="dy-btn-sm"
                        style:background-color={$themeColors['HighlighterPenOrange']}
                        style:border={buttonBorder}
                        on:click={() => modifyHighlight(4)}
                    />
                    <!-- svelte-ignore a11y-click-events-have-key-events -->
                    <div
                        class="dy-btn-sm"
                        style:background-color={$themeColors['HighlighterPenPink']}
                        style:border={buttonBorder}
                        on:click={() => modifyHighlight(5)}
                    />
                    <!-- svelte-ignore a11y-click-events-have-key-events -->
                    <div
                        class="dy-btn-sm"
                        style:background-color={'white'}
                        style:border={buttonBorder}
                        on:click={() => modifyHighlight(6)}
                    />
                </div>
            {:else}
                {#if isAudioPlayable}
                    <button class="dy-btn-sm dy-btn-ghost">
                        <AudioIcon.Play color={barIconColor} />
                    </button>
                {/if}
                {#if isRepeatableAudio}
                    <button class="dy-btn-sm dy-btn-ghost">
                        <AudioIcon.PlayRepeat color={barIconColor} />
                    </button>
                {/if}
                {#if isTextOnImageEnabled}
                    <button class="dy-btn-sm dy-btn-ghost">
                        <ImageIcon.Image color={barIconColor} />
                    </button>
                {/if}
                {#if isHighlightEnabled}
                    <button
                        class="dy-btn-sm dy-btn-ghost"
                        on:click={() => (showHightlightPens = true)}
                    >
                        <HighlightIcon color={barIconColor} />
                    </button>
                {/if}
                {#if isNotesEnabled}
                    <button class="dy-btn-sm dy-btn-ghost" on:click={() => modifyNote()}>
                        <NoteIcon color={barIconColor} />
                    </button>
                {/if}
                {#if isBookmarkEnabled}
                    <button
                        class="dy-btn-sm dy-btn-ghost"
                        on:click={async function () {
                            await modifyBookmark();
                        }}
                    >
                        {#if selectedVerseInBookmarks >= 0}
                            <BookmarkIcon color="#b10000" />
                        {:else}
                            <BookmarkOutlineIcon color={barIconColor} />
                        {/if}
                    </button>
                {/if}
                {#if isCopyEnabled}
                    <button class="dy-btn-sm dy-btn-ghost" on:click={() => copy()}>
                        <CopyContentIcon color={barIconColor} />
                    </button>
                {/if}
                {#if isShareEnabled}
                    <button class="dy-btn-sm dy-btn-ghost">
                        <ShareIcon color={barIconColor} />
                    </button>
                {/if}
            {/if}
        </div>
    </div>
</div>

<style>
    .pen-grid {
        grid-template-columns: repeat(6, 3rem);
    }
</style>
