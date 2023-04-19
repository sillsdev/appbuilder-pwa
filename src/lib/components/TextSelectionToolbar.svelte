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
<script>
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
    import config from '$lib/data/config.js';
    import { t, s, refs, bookmarks, notes, highlights, selectedVerses } from '$lib/data/stores';
    import toast, { Toaster } from 'svelte-french-toast';

    const isAudioPlayable = config?.mainFeatures['text-select-play-audio'];
    const isRepeatableAudio = config?.mainFeatures['audio-repeat-selection-button'];
    const isTextOnImageEnabled = config?.mainFeatures['text-on-image'];
    const isBookmarkEnabled = config?.mainFeatures['annotation-bookmarks'];
    const isHighlightEnabled = config?.mainFeatures['annotation-highlights'];
    const isNotesEnabled = config?.mainFeatures['annotation-notes'];

    var isHighlight = false;
    var selectedVerseInBookmarks = -1;

    $: isCopyEnabled = config.bookCollections.find((x) => x.id === $refs.collection).features[
        'bc-allow-copy-text'
    ];
    $: isShareEnabled = config.bookCollections.find((x) => x.id === $refs.collection).features[
        'bc-allow-share-text'
    ];
    $: $selectedVerses, updateSelectedVerseInBookmarks($selectedVerses);

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
        for (var i = 1; i < $selectedVerses.size; i++) {
            extraVerses = extraVerses.concat(', ' + $selectedVerses[i]['verse']);
        }
        scriptureReference.concat(extraVerses);

        return scriptureReference;
    }

    function updateSelectedVerseInBookmarks(selectedVerses) {
        selectedVerseInBookmarks = findAnnotation($bookmarks, selectedVerses[0]);
    }
    function findAnnotation(annotations, annotation) {
        let index = -1;
        for (var i = 0; i < annotations.length; i++) {
            if (
                annotations[i].docSet === annotation.docSet &&
                annotations[i].book === annotation.book &&
                annotations[i].chapter === annotation.chapter &&
                annotations[i].verse === annotation.verse
            ) {
                index = i;
                break;
            }
        }
        return index;
    }
    function modifyBookmark() {
        // If there is already a bookmark at this verse, remove it
        const index = findAnnotation($bookmarks, $selectedVerses[0]);
        if (index === -1) {
            addBookmark();
        } else {
            removeBookmark(index);
        }
        selectedVerses.reset();
    }
    function addBookmark() {
        const timeElapsed = Date.now();
        const today = new Date(timeElapsed);
        $bookmarks = [
            ...$bookmarks,
            {
                id: $bookmarks.length,
                reference: selectedVerses.getReference(0),
                text: selectedVerses.getVerseByIndex(0).text,
                date: today.toDateString(),
                docSet: $selectedVerses[0].docSet,
                book: $selectedVerses[0].book,
                chapter: $selectedVerses[0].chapter,
                verse: $selectedVerses[0].verse
            }
        ];
    }

    function removeBookmark(index) {
        bookmarks.update((b) => {
            b.splice(index, 1);
            return b;
        });
    }
    function addNote() {
        const timeElapsed = Date.now();
        const today = new Date(timeElapsed);

        $notes.push({
            id: $notes.size + 1,
            reference: selectedVerses.getReference(0),
            text: selectedText(),
            date: today.toDateString()
        });
        selectedVerses.reset();
    }

    function modifyHighlight(numColor) {
        if (numColor == 6) {
            removeHighlight();
        } else {
            addHighlight(numColor);
        }
        selectedVerses.reset();
    }
    function addHighlight(numColor) {
        if (numColor > 5 || numColor < 1) {
            numColor = 1;
        }

        const timeElapsed = Date.now();
        const today = new Date(timeElapsed);
        const verseCount = $selectedVerses.length;

        isHighlight = false;

        for (var i = 0; i < verseCount; i++) {
            const index = findAnnotation($highlights, $selectedVerses[i]);
            if (index === -1 || $highlights[index].penColor !== numColor) {
                $highlights = [
                    ...$highlights,
                    {
                        id: $highlights.length,
                        reference: selectedVerses.getReference(i),
                        text: selectedVerses.getVerseByIndex(i)['text'],
                        date: today.toDateString(),
                        penColor: numColor,
                        docSet: $selectedVerses[i].docSet,
                        book: $selectedVerses[i].book,
                        chapter: $selectedVerses[i].chapter,
                        verse: $selectedVerses[i].verse
                    }
                ];
            }
        }
    }
    function removeHighlight() {
        const verseCount = $selectedVerses.length;
        for (var i = 0; i < verseCount; i++) {
            let index = findAnnotation($highlights, $selectedVerses[i]);
            // Could be highlighted with multiple colors, remove all
            while (index !== -1) {
                highlights.update((h) => {
                    h.splice(index, 1);
                    return h;
                });
                index = findAnnotation($highlights, $selectedVerses[i]);
            }
        }
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
    class="h-8 bg-base-100 mx-auto flex items-center flex-col"
    style:background-color={barBackgroundColor}
>
    <div class="flex flex-col justify-center w-11/12 flex-grow">
        <!-- Controls -->
        <div class="dy-btn-group place-self-center">
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
                <button class="dy-btn-sm dy-btn-ghost" on:click={() => modifyHighlight(2)}>
                    <HighlightIcon color={barIconColor} />
                </button>
            {/if}
            {#if isNotesEnabled}
                <button class="dy-btn-sm dy-btn-ghost" on:click={() => addNote()}>
                    <NoteIcon color={barIconColor} />
                </button>
            {/if}
            {#if isBookmarkEnabled}
                <button class="dy-btn-sm dy-btn-ghost" on:click={() => modifyBookmark()}>
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
        </div>
    </div>
</div>
