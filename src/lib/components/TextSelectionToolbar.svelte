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
    import { createEventDispatcher } from 'svelte';
    import { ImageIcon } from '$lib/icons/image';
    import config from '$lib/data/config';
    import {
        t,
        s,
        refs,
        modal,
        MODAL_NOTE,
        selectedVerses,
        theme,
        themeColors,
        audioActive
    } from '$lib/data/stores';
    import { addBookmark, findBookmark, removeBookmark } from '$lib/data/bookmarks';
    import { addHighlights, removeHighlights } from '$lib/data/highlights';
    import { shareText } from '$lib/data/share';
    import { play, seekToVerse } from '$lib/data/audio';
    import { getBook, logShareContent } from '$lib/data/analytics';
    const isAudioPlayable = config?.mainFeatures['text-select-play-audio'];
    const isRepeatableAudio = config?.mainFeatures['audio-repeat-selection-button'];
    const isTextOnImageEnabled = config?.mainFeatures['text-on-image'];
    const isBookmarkEnabled = config?.mainFeatures['annotation-bookmarks'];
    const isHighlightEnabled = config?.mainFeatures['annotation-highlights'];
    const isNotesEnabled = config?.mainFeatures['annotation-notes'];

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
            const text = await selectedVerses.getVerseTextByIndex(0);
            await addBookmark({
                docSet: $selectedVerses[0].docSet,
                collection: $selectedVerses[0].collection,
                book: $selectedVerses[0].book,
                chapter: $selectedVerses[0].chapter,
                verse: $selectedVerses[0].verse,
                text,
                reference: $selectedVerses[0].reference
            });
        } else {
            await removeBookmark(selectedVerseInBookmarks);
        }

        selectedVerses.reset();
    }

    async function modifyHighlight(numColor) {
        if (numColor == 6) {
            await removeHighlights($selectedVerses);
        } else {
            await addHighlights(numColor, $selectedVerses, selectedVerses.getVerseTextByIndex);
        }

        selectedVerses.reset();
    }
    // resets underlined verses and plays verse audio
    function playVerseAudio() {
        const element = $selectedVerses[0].verse;
        const tagSelected = element + 'a';
        seekToVerse(tagSelected);
        play();
        $audioActive = true;
        selectedVerses.reset();
    }
    async function copy() {
        var copyText =
            (await selectedVerses.getCompositeText()) +
            '\n' +
            selectedVerses.getCompositeReference();
        navigator.clipboard.writeText(copyText);
        notifyTextCopied(copyText);
        selectedVerses.reset();
    }
    async function shareSelectedText() {
        const book = $selectedVerses[0].book;
        const reference = selectedVerses.getCompositeReference();
        const text = await selectedVerses.getCompositeText();
        const bookCol = $selectedVerses[0].collection;
        const fullBook = getBook({ collection: bookCol, book: book });
        const bookAbbrev = fullBook.abbreviation ?? fullBook.name;
        shareText(config.name, config.name + '\n\n' + text + '\n' + reference, book + '.txt');
        logShareContent('Text', bookCol, bookAbbrev, reference);
    }

    $: barBackgroundColor = $s['ui.bar.text-select']['background-color'];
    $: barIconColor = $s['ui.bar.text-select.icon']['color'];
    const dispatch = createEventDispatcher();
    function notifyTextCopied(text) {
        dispatch('copied', {
            text
        });
    }
</script>

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
                    <!-- svelte-ignore a11y-interactive-supports-focus -->
                    <div
                        class="dy-btn-sm"
                        style:background-color={$themeColors['HighlighterPenYellow']}
                        style:border={buttonBorder}
                        on:click={() => modifyHighlight(1)}
                        role="button"
                    />
                    <!-- svelte-ignore a11y-click-events-have-key-events -->
                    <!-- svelte-ignore a11y-interactive-supports-focus -->
                    <div
                        class="dy-btn-sm"
                        style:background-color={$themeColors['HighlighterPenGreen']}
                        style:border={buttonBorder}
                        on:click={() => modifyHighlight(2)}
                        role="button"
                    />
                    <!-- svelte-ignore a11y-click-events-have-key-events -->
                    <!-- svelte-ignore a11y-interactive-supports-focus -->
                    <div
                        class="dy-btn-sm"
                        style:background-color={$themeColors['HighlighterPenBlue']}
                        style:border={buttonBorder}
                        on:click={() => modifyHighlight(3)}
                        role="button"
                    />
                    <!-- svelte-ignore a11y-click-events-have-key-events -->
                    <!-- svelte-ignore a11y-interactive-supports-focus -->
                    <div
                        class="dy-btn-sm"
                        style:background-color={$themeColors['HighlighterPenOrange']}
                        style:border={buttonBorder}
                        on:click={() => modifyHighlight(4)}
                        role="button"
                    />
                    <!-- svelte-ignore a11y-click-events-have-key-events -->
                    <!-- svelte-ignore a11y-interactive-supports-focus -->
                    <div
                        class="dy-btn-sm"
                        style:background-color={$themeColors['HighlighterPenPink']}
                        style:border={buttonBorder}
                        on:click={() => modifyHighlight(5)}
                        role="button"
                    />
                    <!-- svelte-ignore a11y-click-events-have-key-events -->
                    <!-- svelte-ignore a11y-interactive-supports-focus -->
                    <div
                        class="dy-btn-sm"
                        style:background-color={'white'}
                        style:border={buttonBorder}
                        on:click={() => modifyHighlight(6)}
                        role="button"
                    />
                </div>
            {:else}
                {#if isAudioPlayable && $refs.hasAudio && $refs.hasAudio.timingFile}
                    <button class="dy-btn-sm dy-btn-ghost" on:click={() => playVerseAudio()}>
                        <AudioIcon.Play color={barIconColor} />
                    </button>
                {/if}
                {#if isRepeatableAudio && $refs.hasAudio && $refs.hasAudio.timingFile}
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
                    <button class="dy-btn-sm dy-btn-ghost" on:click={() => modal.open(MODAL_NOTE)}>
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
                    <button class="dy-btn-sm dy-btn-ghost" on:click={copy}>
                        <CopyContentIcon color={barIconColor} />
                    </button>
                {/if}
                {#if isShareEnabled}
                    <button class="dy-btn-sm dy-btn-ghost" on:click={shareSelectedText}>
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
