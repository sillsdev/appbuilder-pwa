<!--
@component
Based on an audio component found at https://svelte.dev/repl/b0a901d9a15347bd95466150485e4a78?version=3.31.0.
Wraps a JS-created HTMLAudioElement with a basic UI with a progress bar and Play/Pause, Seek, and Skip functionality.  
TODO:
- display audio not found message in UI when audio is not found
-->
<script>
    import { AudioIcon } from '$lib/icons';
    import { refs, audioHighlight, audioActive } from '$lib/data/stores';
    import { catalog } from '$lib/data/catalog';
    import SkipPreviousIcon from '$lib/icons/audio/SkipPreviousIcon.svelte';
    let duration = NaN;
    let progress = 0;
    let playing = false;
    let loaded = false;
    let playAfterSkip = false;
    let timeIndex = 0;
    let timing = [];

    /**@type{HTMLAudioElement}*/ let audio;

    //get the audio source and timing files, based off the current reference
    const getAudio = async (collection, book, chapter) => {
        if (playing) playPause();
        loaded = false;
        duration = NaN;
        progress = 0;

        const res = await fetch('/data/audio', {
            method: 'POST',
            body: JSON.stringify({
                collection: collection,
                book: book,
                chapter: chapter
            }),
            headers: {
                'content-type': 'application/json',
                accept: 'application/json'
            }
        });
        const j = await res.json();
        if (j.error) {
            console.error(j.error);
            return;
        }

        let nextRef;
        const unsub = refs.subscribe((v) => {
            nextRef = v;
        }, 'next');

        function getNextChapter() {
            console.log('getNextChapter() starting');
            let nextCollection = $refs.docSet + 1;
            let nextBook = $refs.book + 1;
            console.log('getNextChapter() 2');
            let origBook = nextBook;
            let nextChapter = $refs.chapter + 1;
            console.log('getNextChapter() 3');

            /**list of books in current docSet*/
            let books = catalog.find((d) => d.id === nextRef.docSet).documents;
            /**list of chapters in current book*/
            let chapters = books.find((d) => d.bookCode === nextRef.book).versesByChapters;
            /**Number of chapters in current book*/
            let numChapters = Object.keys(chapters).length;
            console.log('getNextChapter() 4');
            console.log(numChapters);
            //let numBooks = catalog.find((d) => d.id === nextRef.docSet).documents.length;

            console.log(origBook);
            console.log(books);
            console.log(numChapters);
            let nextAudio = getAudio(nextCollection, nextBook, nextChapter);
            console.log('getNextChapter: before first if');
            if (nextChapter > numChapters) {
                nextChapter = 1;
                nextBook++;
            }
            if (nextBook > books) {
                nextBook = 1;
                nextCollection++;
            }
            console.log('nextChapter: ', nextChapter);
            //return { nextCollection, nextBook, nextChapter };
            return { nextCollection, origBook, nextChapter };
        }

        const a = new Audio(`${j.source}`);
        a.addEventListener('ended', () => {
            console.log('Got to end of audio');
            let { nextCollection, nextBook, nextChapter } = getNextChapter();
            console.log(
                'after getNextChapter(), nextBook: ',
                nextBook,
                ' nextChapter: ',
                nextChapter
            );

            console.log('after getAudio');
            if (playing) {
                skip();
                getAudio;
                playPause();
                //updateTime();
                console.log('paused');
                //playAfterSkip = true;
                //playPause();
                console.log('after playAfterSkip = true');
            }
        });

        a.onloadedmetadata = () => {
            duration = a.duration;
            timeIndex = 0;
            loaded = true;
            audio = a;
            updateTime();
            if (playAfterSkip && !playing) {
                playPause();
                playAfterSkip = false;
            }
        };
        timing = j.timing;
    };
    $: getAudio($refs.docSet, $refs.book, $refs.chapter);
    $: (() => {
        if (!$audioActive && playing) playPause();
    })();
    /**updates the progress bar, and if necessary the timeIndex*/
    const updateTime = () => {
        if (!loaded) return;
        progress = audio.currentTime;
        if (progress >= timing[timeIndex].time) timeIndex++;
        else if (timeIndex > 0 && progress < timing[timeIndex - 1].time) timeIndex--;
        $audioHighlight = [
            $refs.docSet,
            $refs.book,
            $refs.chapter,
            timing[timeIndex].tag.match(/[0-9]+/) ? timing[timeIndex].tag.match(/[0-9]+/) : 'title',
            timing[timeIndex].tag.match(/[0-9]+/)
                ? timing[timeIndex].tag.match(/[a-z]/i)
                    ? timing[timeIndex].tag.match(/[a-z]/i)
                    : 'none'
                : 'none'
        ].join();
    };

    /**sets an interval for updateTime*/
    const toggleTimeRunning = (() => {
        let timer;
        return () => {
            if (audio.ended) {
                playing = false;
                audio.pause();
                progress = 0;
            } else {
                timer = setInterval(updateTime, 100);
            }
        };
    })();
    /**plays or pauses the audio*/
    const playPause = () => {
        if (!loaded) return;
        toggleTimeRunning();
        if (playing) {
            audio?.pause();
            playing = false;
        } else {
            audio.play();
            playing = true;
        }
    };

    /**seeks the audio*/
    const seek = (() => {
        let seekTimer;
        let mutedBySeek;
        return (scale) => {
            clearInterval(seekTimer);
            if (!loaded) return;
            if (mutedBySeek) audio.muted = false;
            if (scale === 0) {
                audio.playbackRate = audio.defaultPlaybackRate;
            } else if (scale > 0) {
                mutedBySeek = true;
                audio.muted = true;
                audio.playbackRate = audio.defaultPlaybackRate * scale;
            } else {
                seekTimer = setInterval(() => {
                    mutedBySeek = true;
                    audio.muted = true;
                    audio.currentTime -= audio.defaultPlaybackRate;
                }, 100);
            }
        };
    })();
    /**skips to previous or next chapter if it exists*/
    const skip = (direction) => {
        const switchTo = direction < 0 ? $refs.prev : $refs.next;
        // if the chapter exists, the book will too, so only need to check chapter
        if (switchTo.chapter) {
            $refs = { book: switchTo.book, chapter: switchTo.chapter };
            refs.set({ book: switchTo.book, chapter: switchTo.chapter }, 'next');
            playAfterSkip = true && playing;
        }
    };

    function seekAudio(event) {
        if (!loaded) return;
        // Calculate the percentage of the progress bar that was clicked
        const progressBar = document.getElementById('progress-bar');
        const percent = (event.clientX - progressBar.offsetLeft) / progressBar.offsetWidth;
        // Set the current time of the audio element to the corresponding time based on the percent
        audio.currentTime = duration * percent;
    }
</script>

<div class="w-11/12 h-5/6 bg-base-100 mx-auto rounded-full flex items-center flex-col">
    <div class="flex flex-col justify-center w-11/12 flex-grow">
        <!-- Progress Bar -->
        {#if loaded}
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <progress
                id="progress-bar"
                on:click={seekAudio}
                class="dy-progress w-11/12 h-1 place-self-end mx-2 my-1"
                value={progress}
                max={duration}
            />
        {:else}
            <progress class="dy-progress w-11/12 h-1 place-self-end mx-2 my-1" value="0" max="1" />
        {/if}
        <!-- Controls -->
        <div class="dy-btn-group place-self-center">
            <button class="dy-btn-sm dy-btn-ghost" on:click={() => skip(-1)}>
                <AudioIcon.Prev />
            </button>
            <button
                class="dy-btn-sm dy-btn-ghost"
                on:pointerdown={() => seek(-1)}
                on:pointerup={() => seek(0)}
                on:pointercancel={() => seek(0)}
            >
                <AudioIcon.RW />
            </button>
            <button id="play-pause" class="dy-btn-sm dy-btn-ghost" on:click={playPause}>
                {#if !playing}
                    <AudioIcon.Play />
                {:else}
                    <AudioIcon.Pause />
                {/if}
            </button>
            <button
                class="dy-btn-sm dy-btn-ghost"
                on:pointerdown={() => seek(4)}
                on:pointerup={() => seek(0)}
                on:pointercancel={() => seek(0)}
            >
                <AudioIcon.FF />
            </button>
            <button class="dy-btn-sm dy-btn-ghost" on:click={() => skip(1)}>
                <AudioIcon.Skip />
            </button>
        </div>
    </div>
</div>
