<!--
@component
Taken from modifying a copy of the AudioBar.svelte file
Enables users to copy, highlight, bookmark, share, and annotate selected verses.
TODO:
- Enable/Disable copy and share button
- Check platform to change to iOS style if MacOS (?)
- Attach functionality to each of the buttons [Decomp this]
- Make play button connected to existence of audio

CURRENT: Can make it so that clicking on bookmark adds hardcoded bookmarked text
NEXT: Can make it so that clicking on highlight adds random highlighted text
NEXT: Can make it so that clciking on copy copies random text

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
    import { refs, bookmarks } from '$lib/data/stores';
    //use $refs.collection as needed

    //Appears dependent on settings
    const isTextOnImageVideoEnabled = config?.mainFeatures['text-on-image-video'];
    const isTextOnImageEnabled = config?.mainFeatures['text-on-image'];
    const isBookmarkEnabled = config?.mainFeatures['annotation-bookmarks'];
    const isHighlightEnabled = config?.mainFeatures['annotation-highlights'];
    const isNotesEnabled = config?.mainFeatures['annotation-notes'];

    //Appears regardless of settings (Hardcoded)
    const isPlayable = true;
    // const isCopyEnabled = true;
    // const isShareEnabled = true;

    // Below two (isCopyEnabled and isShareEnabled) are not functioning yet
    // NOTE: isShareEnabled breaks the code for some reason

    $: isCopyEnabled = config.bookCollections.find((x) => x.id === $refs.collection).features[
        'bc-allow-copy-text'
    ];
    $: isShareEnabled = config.bookCollections.find((x) => x.id === $refs.collection).features[
        'bc-allow-share-text'
    ];

    function addBookmark() {
        $bookmarks.push({
            id: $bookmarks.size + 1,
            reference: 'TestBook 10:4',
            text: 'This is a verse placeholder text',
            date: '31 February 2024'
        });
    }

    //Hardcoded copy function for now
    function copy() {
        var copyText = 'He must increase, but I must decrease.\n\nJohn 3:30';

        // Copy the text inside the text field
        navigator.clipboard.writeText(copyText);

        // Alert the copied text
        alert('Copied the text: ' + copyText);
    }
</script>

<div class="h-5/6 bg-base-100 mx-auto flex items-center flex-col">
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
                <button class="dy-btn-sm dy-btn-ghost">
                    <HighlightIcon />
                </button>
            {/if}
            {#if isNotesEnabled}
                <button class="dy-btn-sm dy-btn-ghost">
                    <NoteIcon />
                </button>
            {/if}
            {#if isBookmarkEnabled}
                <button class="dy-btn-sm dy-btn-ghost" on:click={() => addBookmark()}>
                    <BookmarkOutlineIcon />
                </button>
            {/if}
            {#if isCopyEnabled}
                <button on:click={() => copy()} class="dy-btn-sm dy-btn-ghost">
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
