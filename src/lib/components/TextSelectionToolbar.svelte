<!--
@component
Taken from modifying a copy of the AudioBar.svelte file
Enables users to copy, highlight, bookmark, share, and annotate selected verses.
TODO:
- Enable/Disable copy and share button
- Check platform to change to iOS style if MacOS (?)
- Attach functionality to each of the buttons [Decomp this]
- Make play button connected to existence of audio
-->
<script>
    import CopyContentIcon from '$lib/icons/CopyContentIcon.svelte';
    import HighlightIcon from '$lib/icons/HighlightIcon.svelte';
    import NoteIcon from '$lib/icons/NoteIcon.svelte';
    import BookmarkOutlineIcon from '$lib/icons/BookmarkOutlineIcon.svelte';
    import ShareIcon from '$lib/icons/ShareIcon.svelte';
    import PlayIcon from '$lib/icons/audio/PlayIcon.svelte';
    import ImageIcon from '$lib/icons/image/ImageSingleIcon.svelte';
    import PlayRepeatIcon from '$lib/icons/audio/PlayRepeatIcon.svelte';
    import config from '$lib/data/config.js';
    import { t, refs, bookmarks, notes, highlights, selectedVerses } from '$lib/data/stores';
    import toast, { Toaster } from 'svelte-french-toast';
    //use $refs.collection as needed

    //Appears dependent on settings
    const isTextOnImageVideoEnabled = config?.mainFeatures['text-on-image-video'];
    const isTextOnImageEnabled = config?.mainFeatures['text-on-image'];
    const isBookmarkEnabled = config?.mainFeatures['annotation-bookmarks'];
    const isHighlightEnabled = config?.mainFeatures['annotation-highlights'];
    const isNotesEnabled = config?.mainFeatures['annotation-notes'];

    //Appears regardless of settings (Hardcoded)
    const isPlayable = true;

    $: isCopyEnabled = config.bookCollections.find((x) => x.id === $refs.collection).features[
        'bc-allow-copy-text'
    ];
    $: isShareEnabled = config.bookCollections.find((x) => x.id === $refs.collection).features[
        'bc-allow-share-text'
    ];

    function selectedText() {
        var someText = $selectedVerses.reduce((text, v) => (text += v.text), '');
        return someText;
    }

    function selectedTextReference() {
        // grab starting verse
        var scriptureReference =
            $selectedVerses[0]['book'] +
            ' ' +
            $selectedVerses[0]['chapter'] +
            ':' +
            $selectedVerses[0]['verse'];
        // loop to put in references
        var extraVerses = '';
        //var verseCount = Object.keys($selectedVerses).length;
        for (var i = 1; i < $selectedVerses.size; i++) {
            extraVerses = extraVerses.concat(', ' + $selectedVerses[i]['verse']);
        }
        scriptureReference.concat(extraVerses);

        return scriptureReference;
    }

    function addBookmark() {
        const timeElapsed = Date.now();
        const today = new Date(timeElapsed);

        $bookmarks.push({
            id: $bookmarks.size + 1,
            reference: selectedVerses.getReference(0),
            text: selectedText(),
            date: today.toDateString()
        });
        selectedVerses.reset();
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

    function addHighlight() {
        const timeElapsed = Date.now();
        const today = new Date(timeElapsed);
        const verseCount = $selectedVerses.length;

        for (var i = 0; i < verseCount; i++) {
            $highlights.push({
                id: $highlights.size + 1,
                reference: selectedVerses.getReference(i),
                text: selectedVerses.getVerseByIndex(i)['text'],
                date: today.toDateString(),
                highlight_color: '2'
            });
            selectedVerses.removeVerse(0);
        }
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
</script>

<Toaster />
<div class="h-8 bg-base-100 mx-auto flex items-center flex-col">
    <div class="flex flex-col justify-center w-11/12 flex-grow">
        <!-- Controls -->
        <div class="dy-btn-group place-self-center">
            {#if isPlayable}
                <button class="dy-btn-sm dy-btn-ghost">
                    <PlayIcon />
                </button>
            {/if}
            {#if isTextOnImageVideoEnabled}
                <button class="dy-btn-sm dy-btn-ghost">
                    <PlayRepeatIcon />
                </button>
            {/if}
            {#if isTextOnImageEnabled}
                <button class="dy-btn-sm dy-btn-ghost">
                    <ImageIcon />
                </button>
            {/if}
            {#if isHighlightEnabled}
                <button class="dy-btn-sm dy-btn-ghost" on:click={() => addHighlight()}>
                    <HighlightIcon />
                </button>
            {/if}
            {#if isNotesEnabled}
                <button class="dy-btn-sm dy-btn-ghost" on:click={() => addNote()}>
                    <NoteIcon />
                </button>
            {/if}
            {#if isBookmarkEnabled}
                <button class="dy-btn-sm dy-btn-ghost" on:click={() => addBookmark()}>
                    <BookmarkOutlineIcon />
                </button>
            {/if}
            {#if isCopyEnabled}
                <button class="dy-btn-sm dy-btn-ghost" on:click={() => copy()}>
                    <CopyContentIcon />
                </button>
            {/if}
            {#if isShareEnabled}
                <button class="dy-btn-sm dy-btn-ghost">
                    <ShareIcon />
                </button>
            {/if}
        </div>
    </div>
</div>
