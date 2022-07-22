<script>
    import { AudioIcon } from '$lib/icons';
    import { refs, audioHighlight } from '$lib/data/stores';
    //based on https://svelte.dev/repl/b0a901d9a15347bd95466150485e4a78?version=3.31.0
    export let src = '';
    let duration = NaN;
    let progress = 0;
    let timer;
    let playing = false;
    let timeIndex = 0;
    let timing = [
        { time: 4.36, tag: 'title' },
        { time: 6.92, tag: '1a' },
        { time: 8.04, tag: '1b' },
        { time: 10.08, tag: '1c' },
        { time: 13.76, tag: '2' },
        { time: 15.8, tag: '3a' },
        { time: 17.32, tag: '3b' },
        { time: 19.72, tag: '3c' },
        { time: 21.2, tag: '4a' },
        { time: 23.92, tag: '4b' },
        { time: 25.68, tag: '5a' },
        { time: 28.48, tag: '5b' },
        { time: 30.96, tag: '6a' },
        { time: 32.84, tag: '6b' },
        { time: 34.44, tag: '7a' },
        { time: 36.6, tag: '7b' },
        { time: 39.36, tag: '7c' },
        { time: 40.7, tag: '8a' },
        { time: 43.56, tag: '8b' },
        { time: 48.2, tag: '9' },
        { time: 50.2, tag: '10a' },
        { time: 54.28, tag: '10b' },
        { time: 54.96, tag: '10c' },
        { time: 56.4, tag: '11a' },
        { time: 59.28, tag: '11b' },
        { time: 61.54, tag: '12a' },
        { time: 64.44, tag: '12b' },
        { time: 66.92, tag: '12c' },
        { time: 68.64, tag: '13a' },
        { time: 69.52, tag: '13b' },
        { time: 71.2, tag: '13c' },
        { time: 72.64, tag: '13d' },
        { time: 75.4, tag: '13e' },
        { time: 78.28, tag: '14a' },
        { time: 79.72, tag: '14b' },
        { time: 82.56, tag: '14c' },
        { time: 85.16, tag: '14d' },
        { time: 87, tag: '15a' },
        { time: 88.16, tag: ' 15b' },
        { time: 88.8, tag: '15c' },
        { time: 91.08, tag: '15d' },
        { time: 94.76, tag: '15e' },
        { time: 97.08, tag: '15f' },
        { time: 101.36, tag: '16' },
        { time: 103.18, tag: '17a' },
        { time: 107.96, tag: '17b' },
        { time: 110.14, tag: '18a' },
        { time: 111.76, tag: '18b' },
        { time: 113.56, tag: '18c' },
        { time: 116.32, tag: '18d' },
        { time: +Infinity, tag: '0' }
    ];
    $: audio = (() => {
        const a = new Audio(src);
        a.onloadedmetadata = () => {
            duration = a.duration;
            timeIndex = 0;
            updateTime();
        };
        return a;
    })();

    function updateTime() {
        progress = audio.currentTime;
        if (progress >= timing[timeIndex].time) timeIndex++;
        else if (timeIndex > 0 && progress < timing[timeIndex - 1].time) timeIndex--;
        $audioHighlight = timing[timeIndex].tag;
        if (audio.ended) toggleTimeRunning();
    }
    const toggleTimeRunning = () => {
        if (audio.ended) {
            playing = false;
            clearInterval(timer);
        } else {
            timer = setInterval(updateTime, 100);
        }
    };

    const playPause = () => {
        //clearInterval(timer);
        toggleTimeRunning();
        console.log(playing ? 'playing' : 'paused');
        if (playing) {
            audio.pause();
            playing = false;
        } else {
            audio.play();
            playing = true;
        }
    };

    const seek = (() => {
        let seekTimer;
        let mutedBySeek;
        return (scale) => {
            clearInterval(seekTimer);
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

    const skip = (direction) => {
        console.log(
            `${direction}: ${JSON.stringify(
                direction < 0 ? $refs['default'].prev : $refs['default'].next
            )}`
        );
    };
</script>

<div class="w-11/12 h-5/6 bg-base-100 mx-auto rounded-full flex items-center flex-col">
    <div class="flex flex-col justify-center w-11/12 flex-grow">
        {#if src}
            <progress
                class="dy-progress w-11/12 h-1 place-self-end mx-2 my-1"
                value={progress}
                max={duration}
            />
        {:else}
            <progress class="dy-progress w-11/12 h-1 place-self-end mx-2 my-1" value="0" max="1" />
        {/if}
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
            <button class="dy-btn-sm dy-btn-ghost" on:click={playPause}>
                <!--{#if audio?.paused}-->
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
