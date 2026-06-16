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
    import { goto } from '$app/navigation';
    import { resolve } from '$app/paths';
    import { scriptureConfig } from '$assets/config';
    import { getBook, logShareContent } from '$lib/data/analytics';
    import { playVerses } from '$lib/data/audio';
    import { addBookmark, findBookmark, removeBookmark } from '$lib/data/bookmarks';
    import { addHighlights, removeHighlights } from '$lib/data/highlights';
    import { shareText } from '$lib/data/share';
    import {
        audioActive,
        refs,
        s,
        selectedVerses,
        theme,
        themeColors,
        voiCustomImage
    } from '$lib/data/stores';
    import { AudioIcon, CopyContentIcon, HighlightIcon, NoteIcon, ShareIcon } from '$lib/icons';
    import { ImageIcon } from '$lib/icons/image';
    import BookmarkButton from './BookmarkButton.svelte';

    const isAudioPlayable = scriptureConfig?.mainFeatures['text-select-play-audio'];
    const isRepeatableAudio = scriptureConfig?.mainFeatures['audio-repeat-selection-button'];
    const isTextOnImageEnabled = scriptureConfig?.mainFeatures['text-on-image'];
    const isBookmarkEnabled = scriptureConfig?.mainFeatures['annotation-bookmarks'];
    const isHighlightEnabled = scriptureConfig?.mainFeatures['annotation-highlights'];
    const isNotesEnabled = scriptureConfig?.mainFeatures['annotation-notes'];

    let showHighlightPens = $state(false);

    let { oncopy } = $props();

    const isCopyEnabled = $derived(
        scriptureConfig.bookCollections?.find((x) => x.id === $refs.collection)?.features[
            'bc-allow-copy-text'
        ]
    );
    const isShareEnabled = $derived(
        scriptureConfig.bookCollections?.find((x) => x.id === $refs.collection)?.features[
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

    const highlight_colors = [
        { color: $themeColors['HighlighterPenYellow'], number: 1 },
        { color: $themeColors['HighlighterPenGreen'], number: 2 },
        { color: $themeColors['HighlighterPenBlue'], number: 3 },
        { color: $themeColors['HighlighterPenOrange'], number: 4 },
        { color: $themeColors['HighlighterPenPink'], number: 5 },
        { color: 'white', number: 6 }
    ];

    async function modifyHighlight(numColor: number) {
        if (numColor == 6) {
            await removeHighlights($selectedVerses);
        } else {
            await addHighlights(numColor, $selectedVerses, selectedVerses.getVerseTextByIndex);
        }

        selectedVerses.reset();
    }

    // Play from first selected verse, optionally repeating after the last verse
    function playSelectedVerseAudio(options: { repeat: boolean }) {
        const startVerse = $selectedVerses[0].verse;

        if (options.repeat) {
            const endVerse = $selectedVerses[$selectedVerses.length - 1].verse;
            playVerses(startVerse, endVerse);
        } else {
            playVerses(startVerse);
        }

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
        const bookAbbrev = fullBook?.abbreviation ?? fullBook?.name;
        shareText(
            scriptureConfig.name ?? '',
            scriptureConfig.name + '\n\n' + text + '\n' + reference,
            book + '.txt'
        );
        logShareContent('Text', bookCol, bookAbbrev ?? '', reference);
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
                <div class="pen-grid grid grid-rows-1 gap-2 my-2">
                    {#each highlight_colors as { color, number }}
                        <button
                            class="dy-btn-sm"
                            style:background-color={color}
                            style:border={buttonBorder}
                            onclick={() => modifyHighlight(number)}
                            aria-label="Highlight {color}"
                        ></button>
                    {/each}
                </div>
            {:else}
                {#if isAudioPlayable && $refs.hasAudio?.timingFile}
                    <button
                        class="dy-btn-sm dy-btn-ghost"
                        onclick={() => playSelectedVerseAudio({ repeat: false })}
                    >
                        <AudioIcon.Play color={iconColor} />
                    </button>
                {/if}
                {#if isRepeatableAudio && $refs.hasAudio?.timingFile}
                    <button
                        class="dy-btn-sm dy-btn-ghost"
                        onclick={() => playSelectedVerseAudio({ repeat: true })}
                    >
                        <AudioIcon.PlayRepeat color={iconColor} />
                    </button>
                {/if}
                {#if isTextOnImageEnabled}
                    <button
                        onclick={() => {
                            voiCustomImage.update((v) => ({
                                ...v,
                                cropped: null,
                                original: null
                            }));
                            goto(resolve(`/image`));
                        }}
                        class="dy-btn-sm dy-btn-ghost"
                    >
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
                        onclick={() => goto(resolve(`/notes/edit/new`))}
                    >
                        <NoteIcon color={iconColor} />
                    </button>
                {/if}
                {#if isBookmarkEnabled}
                    <BookmarkButton
                        onclick={async function () {
                            await modifyBookmark();
                        }}
                        fillColor="#b10000"
                        emptyColor={iconColor}
                        filled={selectedVerseBookmarks >= 0}
                    />
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
