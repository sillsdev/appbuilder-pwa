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
    import { getBook, logShareContent } from '$lib/data/analytics';
    import { play, seekToVerse } from '$lib/data/audio';
    import { addBookmark, findBookmark, removeBookmark } from '$lib/data/bookmarks';
    import config from '$lib/data/config';
    import { addHighlights, removeHighlights } from '$lib/data/highlights';
    import { shareText } from '$lib/data/share';
    import { audioActive, refs, s, selectedVerses, theme, themeColors } from '$lib/data/stores';
    import {
        AudioIcon,
        BookmarkIcon,
        BookmarkOutlineIcon,
        CopyContentIcon,
        HighlightIcon,
        NoteIcon,
        ShareIcon
    } from '$lib/icons';
    import { ImageIcon } from '$lib/icons/image';
    import { gotoRoute } from '$lib/navigate';

    const isAudioPlayable = config?.mainFeatures['text-select-play-audio'];
    const isRepeatableAudio = config?.mainFeatures['audio-repeat-selection-button'];
    const isTextOnImageEnabled = config?.mainFeatures['text-on-image'];
    const isBookmarkEnabled = config?.mainFeatures['annotation-bookmarks'];
    const isHighlightEnabled = config?.mainFeatures['annotation-highlights'];
    const isNotesEnabled = config?.mainFeatures['annotation-notes'];

    let showHighlightPens = $state(false);

    let { oncopy } = $props();

    const isCopyEnabled = $derived(
        config.bookCollections.find((x) => x.id === $refs.collection).features['bc-allow-copy-text']
    );
    const isShareEnabled = $derived(
        config.bookCollections.find((x) => x.id === $refs.collection).features[
            'bc-allow-share-text'
        ]
    );

    const buttonBorder = $derived('1px solid ' + ($theme === 'Dark' ? '#FFFFFF' : '#888888'));

    let selectedVerseBookmarks = $state(-1);
    async function updateSelectedVerseBookmarks() {
        selectedVerseBookmarks = await findBookmark({
            collection: $selectedVerses[0].collection,
            book: $selectedVerses[0].book,
            chapter: $selectedVerses[0].chapter,
            verse: $selectedVerses[0].verse
        });
        return;
    }

    $effect(() => {
        updateSelectedVerseBookmarks();
    });

    async function modifyBookmark() {
        // If there is already a bookmark at this verse, remove it
        if (selectedVerseBookmarks === -1) {
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
            await removeBookmark(selectedVerseBookmarks);
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
        oncopy(copyText);
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

    const backgroundColor = $derived($s['ui.bar.text-select']['background-color']);
    const iconColor = $derived($s['ui.bar.text-select.icon']['color']);
</script>

<div
    class="h-12 bg-base-100 mx-auto flex items-center flex-col"
    style:background-color={backgroundColor}
>
    <div class="flex flex-col justify-center w-11/12 flex-grow">
        <!-- Controls -->
        <div class="dy-btn-group place-self-center">
            {#if showHighlightPens}
                <!-- svelte-ignore a11y_click_events_have_key_events -->
                <!-- svelte-ignore a11y_interactive_supports_focus -->
                <div class="pen-grid grid grid-rows-1 gap-2 my-2">
                    <div
                        class="dy-btn-sm"
                        style:background-color={$themeColors['HighlighterPenYellow']}
                        style:border={buttonBorder}
                        onclick={() => modifyHighlight(1)}
                        role="button"
                    ></div>
                    <div
                        class="dy-btn-sm"
                        style:background-color={$themeColors['HighlighterPenGreen']}
                        style:border={buttonBorder}
                        onclick={() => modifyHighlight(2)}
                        role="button"
                    ></div>
                    <div
                        class="dy-btn-sm"
                        style:background-color={$themeColors['HighlighterPenBlue']}
                        style:border={buttonBorder}
                        onclick={() => modifyHighlight(3)}
                        role="button"
                    ></div>
                    <div
                        class="dy-btn-sm"
                        style:background-color={$themeColors['HighlighterPenOrange']}
                        style:border={buttonBorder}
                        onclick={() => modifyHighlight(4)}
                        role="button"
                    ></div>
                    <div
                        class="dy-btn-sm"
                        style:background-color={$themeColors['HighlighterPenPink']}
                        style:border={buttonBorder}
                        onclick={() => modifyHighlight(5)}
                        role="button"
                    ></div>
                    <div
                        class="dy-btn-sm"
                        style:background-color={'white'}
                        style:border={buttonBorder}
                        onclick={() => modifyHighlight(6)}
                        role="button"
                    ></div>
                </div>
            {:else}
                {#if isAudioPlayable && $refs.hasAudio && $refs.hasAudio.timingFile}
                    <button class="dy-btn-sm dy-btn-ghost" onclick={() => playVerseAudio()}>
                        <AudioIcon.Play color={iconColor} />
                    </button>
                {/if}
                {#if isRepeatableAudio && $refs.hasAudio && $refs.hasAudio.timingFile}
                    <button class="dy-btn-sm dy-btn-ghost">
                        <AudioIcon.PlayRepeat color={iconColor} />
                    </button>
                {/if}
                {#if isTextOnImageEnabled}
                    <button class="dy-btn-sm dy-btn-ghost">
                        <ImageIcon.Image color={iconColor} />
                    </button>
                {/if}
                {#if isHighlightEnabled}
                    <button
                        class="dy-btn-sm dy-btn-ghost"
                        onclick={() => (showHighlightPens = true)}
                    >
                        <HighlightIcon color={iconColor} />
                    </button>
                {/if}
                {#if isNotesEnabled}
                    <button
                        class="dy-btn-sm dy-btn-ghost"
                        on:click={() => gotoRoute(`/notes/edit/new`)}
                    >
                        <NoteIcon color={iconColor} />
                    </button>
                {/if}
                {#if isBookmarkEnabled}
                    <button
                        class="dy-btn-sm dy-btn-ghost"
                        onclick={async function () {
                            await modifyBookmark();
                        }}
                    >
                        {#if selectedVerseBookmarks >= 0}
                            <BookmarkIcon color="#b10000" />
                        {:else}
                            <BookmarkOutlineIcon color={iconColor} />
                        {/if}
                    </button>
                {/if}
                {#if isCopyEnabled}
                    <button class="dy-btn-sm dy-btn-ghost" onclick={copy}>
                        <CopyContentIcon color={iconColor} />
                    </button>
                {/if}
                {#if isShareEnabled}
                    <button class="dy-btn-sm dy-btn-ghost" onclick={shareSelectedText}>
                        <ShareIcon color={iconColor} />
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
