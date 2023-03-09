<!--
@component
Based on an audio component found at https://svelte.dev/repl/b0a901d9a15347bd95466150485e4a78?version=3.31.0.
Wraps a JS-created HTMLAudioElement with a basic UI with a progress bar and Play/Pause, Seek, and Skip functionality.  
TODO:
- display audio not found message in UI when audio is not found
-->
<script>
    import { AudioIcon } from '$lib/icons';
    import { refs, audioHighlight, audioActive, s, playMode } from '$lib/data/stores';
    import config from '$lib/data/config';
    import { createEventDispatcher } from 'svelte';

    const dispatch = createEventDispatcher();

    let isPopupOpen = false;

    function openPopup() {
        isPopupOpen = true;
    }

    function closePopup() {
        isPopupOpen = false;
    }

    function setPlaySpeed(event) {
        const speed = parseFloat(event.target.value);
        audio.playbackRate = speed;
    }

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

        const method = 'POST';
        const body = JSON.stringify({
            collection: collection,
            book: book,
            chapter: chapter
        });
        const headers = {
            'content-type': 'application/json',
            accept: 'application/json'
        };
        //console.log(`AudioBar: request: body=`, body);
        const res = await fetch('/data/audio', { method, body, headers });
        const j = await res.json();
        if (j.error) {
            console.error(j.error);
            return;
        }
        //console.log(`AudioBar: result=`, j.source);

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
    $: getAudio($refs.collection, $refs.book, $refs.chapter);
    $: (() => {
        if (!$audioActive && playing) playPause();
    })();
    /**updates the progress bar, and if necessary the timeIndex*/
    const updateTime = () => {
        if (!loaded) return;
        progress = audio.currentTime;
        if (timing) {
            if (progress >= timing[timeIndex].time) timeIndex++;
            else if (timeIndex > 0 && progress < timing[timeIndex - 1].time) timeIndex--;
            $audioHighlight = [
                $refs.docSet,
                $refs.book,
                $refs.chapter,
                timing[timeIndex].tag.match(/[0-9]+/)
                    ? timing[timeIndex].tag.match(/[0-9]+/)
                    : 'title',
                timing[timeIndex].tag.match(/[0-9]+/)
                    ? timing[timeIndex].tag.match(/[a-z]/i)
                        ? timing[timeIndex].tag.match(/[a-z]/i)
                        : 'none'
                    : 'none'
            ].join();
        }
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
        if (refs.skip(direction)) {
            playAfterSkip = true && playing;
        }
    };

    function format(seconds) {
        if (isNaN(seconds)) return '...';

        const minutes = Math.floor(seconds / 60);
        seconds = Math.floor(seconds % 60);
        if (seconds < 10) seconds = '0' + seconds;

        return `${minutes}:${seconds}`;
    }

    function mayResetPlayMode(hasTiming) {
        // If the current mode is repeatSelection and the reference is changed to something without timing
        // (even chapter without audio), then reset the playMode.  This matches how the Android app behaves.
        if (!hasTiming && $playMode === 'repeatSelection') {
            playMode.reset();
        }
    }

    const playIconOptons = {
        arrow: AudioIcon.Play,
        'filled-circle': AudioIcon.PlayFillCircle,
        'outline-circle': AudioIcon.PlayOutlineCircle
    };

    const playModeIconOptions = {
        continue: AudioIcon.RepeatOff,
        stop: AudioIcon.RepeatOffStop,
        repeatPage: AudioIcon.Repeat,
        repeatSelection: AudioIcon.RepeatOne
    };

    const showSpeed = config.mainFeatures['settings-audio-speed'];
    const showRepeatMode = config.mainFeatures['audio-repeat-mode-button'];
    const playIconSize = config.mainFeatures['audio-play-button-size'] === 'normal' ? '24' : '48';
    const playIcon = playIconOptons[config.mainFeatures['audio-play-button-style']];
    $: themeColor = $s['ui.bar.action']['background-color'];
    $: iconColor = $s['ui.bar.audio.icon']['color'];
    $: backgroundColor = $s['ui.bar.audio']['background-color'];
    $: dialogBackgroundColor = $s['ui.dialog']['background-color'];
    $: audioBarClass = $refs.hasAudio?.timingFile ? 'audio-bar' : 'audio-bar-progress';
    $: mayResetPlayMode($refs.hasAudio?.timing);
</script>

<div class={audioBarClass} style:background-color={backgroundColor}>
    <div class="dy-button-group audio-repeat">
        {#if showRepeatMode}
            <button
                class="dy-btn-sm dy-btn-ghost"
                on:click={() => playMode.next($refs.hasAudio?.timingFile)}
            >
                <svelte:component this={playModeIconOptions[$playMode]} color={iconColor} />
            </button>
        {/if}
    </div>
    <!-- Play Controls -->
    <div class="dy-btn-group audio-controls">
        <button class="dy-btn-sm dy-btn-ghost" on:click={() => skip(-1)}>
            <AudioIcon.Prev color={iconColor} />
        </button>

        {#if $refs.hasAudio?.timingFile}
            <button
                class="dy-btn-sm dy-btn-ghost"
                on:pointerdown={() => seek(-1)}
                on:pointerup={() => seek(0)}
                on:pointercancel={() => seek(0)}
            >
                <AudioIcon.RW color={iconColor} />
            </button>
        {/if}
        <button
            class="dy-btn-sm dy-btn-ghost"
            class:dy-btn-lg={config.mainFeatures['audio-play-button-size'] === 'large'}
            on:click={playPause}
        >
            {#if !playing}
                <svelte:component this={playIcon} color={iconColor} size={playIconSize} />
            {:else}
                <AudioIcon.Pause color={iconColor} size={playIconSize} />
            {/if}
        </button>
        {#if $refs.hasAudio?.timingFile}
            <button
                class="dy-btn-sm dy-btn-ghost"
                on:pointerdown={() => seek(4)}
                on:pointerup={() => seek(0)}
                on:pointercancel={() => seek(0)}
            >
                <AudioIcon.FF color={iconColor} />
            </button>
        {/if}
        <button class="dy-btn-sm dy-btn-ghost" on:click={() => skip(1)}>
            <AudioIcon.Skip color={iconColor} />
        </button>
    </div>
    <div class="dy-button-group audio-speed">
        {#if showSpeed}
            <button class="dy-btn-sm dy-btn-ghost" on:click={openPopup}>
                <AudioIcon.Speed color={iconColor} />
            </button>
        {/if}
        {#if isPopupOpen}
            <div class="popup">
                <!-- svelte-ignore a11y-click-events-have-key-events -->
                <div class="overlay" on:click={closePopup} />
                <div class="popup-content" style="background-color:{dialogBackgroundColor};">
                    <slot />
                    <h1 style="color:{themeColor}">
                        <b>Playback Speed</b>
                    </h1>
                    <div class="speed-controls">
                        <label>
                            <input type="radio" name="speed" value="0.4" on:click={setPlaySpeed} />
                            0.4x
                        </label>
                        <label>
                            <input type="radio" name="speed" value="0.6" on:click={setPlaySpeed} />
                            0.6x
                        </label>
                        <label>
                            <input type="radio" name="speed" value="0.7" on:click={setPlaySpeed} />
                            0.7x
                        </label>
                        <label>
                            <input type="radio" name="speed" value="0.8" on:click={setPlaySpeed} />
                            0.8x
                        </label>
                        <label>
                            <input
                                type="radio"
                                name="speed"
                                value="1"
                                on:click={setPlaySpeed}
                                checked
                            />
                            Normal
                        </label>
                        <label>
                            <input type="radio" name="speed" value="1.2" on:click={setPlaySpeed} />
                            1.2x
                        </label>
                        <label>
                            <input type="radio" name="speed" value="1.4" on:click={setPlaySpeed} />
                            1.4x
                        </label>
                        <label>
                            <input type="radio" name="speed" value="1.6" on:click={setPlaySpeed} />
                            1.6x
                        </label>
                    </div>
                    <button on:click={closePopup}>Close</button>
                </div>
            </div>
        {/if}
    </div>
    {#if !$refs.hasAudio.timingFile}
        <!-- Progress Bar -->
        <div class="audio-progress-value">{duration ? format(progress) : ''}</div>
        {#if loaded}
            <progress class="dy-progress audio-progress" value={progress} max={duration} />
        {:else}
            <progress class="dy-progress audio-progress" value="0" max="1" />
        {/if}
        <div class="audio-progress-duration">{duration ? format(duration) : ''}</div>
    {/if}
</div>

<style>
    .audio-bar {
        display: grid;
        grid-auto-columns: 3.125rem auto 3.125rem;
        grid-auto-rows: 4rem;
    }
    .audio-bar-progress {
        display: grid;
        grid-auto-columns: 3.125rem auto 3.125rem;
        grid-auto-rows: 3.125rem 1.875rem;
    }
    .audio-progress-value {
        grid-row: 2;
        grid-column: 1;
        place-self: center;
    }
    .audio-progress-duration {
        grid-row: 2;
        grid-column: 3;
        place-self: center;
    }
    .audio-progress {
        grid-row: 2;
        grid-column: 2;
        place-self: center;
    }
    .audio-repeat {
        grid-row: 1;
        grid-column: 1;
        place-self: center;
    }

    .audio-controls {
        grid-row: 1;
        grid-column: 2;
        place-self: center;
        align-items: center;
    }
    .audio-speed {
        grid-row: 1;
        grid-column: 3;
        place-self: center;
    }
    .popup {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 9999;
    }

    .overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(0, 0, 0, 0.5);
    }

    .popup-content {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 90%;
        height: 90%;
        max-width: 700px;
        max-height: 500px;
        padding: 20px;
        border-radius: 5px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
    }

    .speed-controls {
        align-items: left;
        margin-top: 10px;
        display: flex;
        flex-direction: column;
    }

    label {
        margin-right: 0px;
        margin-top: 10px;
        margin-bottom: 10px;
    }
</style>
