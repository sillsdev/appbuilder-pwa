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
    import RepeatOffIcon from '$lib/icons/audio/RepeatOffIcon.svelte';
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

        const a = new Audio(`${j.source}`);
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
        if (audio.ended) toggleTimeRunning();
    };
    /**sets an interval for updateTime*/
    const toggleTimeRunning = (() => {
        let timer;

        return () => {
            if (audio.ended) {
                playing = false;
                clearInterval(timer);
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
</script>

<div class="audio-bar bg-base-100">
    <!-- Progress Bar -->
    {#if loaded}
        <progress class="dy-progress audio-progress" value={progress} max={duration} />
    {:else}
        <progress class="dy-progress audio-progress" value="0" max="1" />
    {/if}
    <div class="dy-button-group audio-repeat">
        <button class="dy-btn-sm dy-btn-ghost">
            <AudioIcon.RepeatOff />
        </button>
    </div>
    <!-- Controls -->
    <div class="dy-btn-group audio-controls ">
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
        <button class="dy-btn-sm dy-btn-ghost" on:click={playPause}>
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
    <div class="dy-button-group audio-speed">
        <button class="dy-btn-sm dy-btn-ghost">
            <AudioIcon.Speed />
        </button>
    </div>
</div>

<style>
    .audio-bar {
        /* padding-block-start: 1rem;
        padding-block-end: 0.5rem; */
        display: grid;
        /* grid-template-columns: repeat(5, 1fr); */
        grid-auto-columns: 50px auto 50px;
        grid-auto-rows: 25px 50px;
        /* grid-row-gap: 0.5rem; */
    }
    .audio-progress {
        grid-row: 1;
        grid-column: 2;
        place-self: center;
    }
    .audio-repeat {
        grid-row: 2;
        grid-column: 1;
        place-self: center;
    }

    .audio-controls {
        grid-row: 2;
        grid-column: 2;
        place-self: center;
    }
    .audio-speed {
        grid-row: 2;
        grid-column: 3;
        place-self: center;
    }
</style>
