<!--
@component
Based on an audio component found at https://svelte.dev/repl/b0a901d9a15347bd95466150485e4a78?version=3.31.0.
Wraps a JS-created HTMLAudioElement with a basic UI with a progress bar and Play/Pause, Seek, and Skip functionality.  
TODO:
- display audio not found message in UI when audio is not found
-->
<script lang="ts">
    import { AudioIcon } from '$lib/icons';
    import {
        refs,
        userSettings,
        s,
        playMode,
        audioPlayer,
        t,
        convertStyle
    } from '$lib/data/stores';
    import AudioPlaybackSpeed from './AudioPlaybackSpeed.svelte';
    import config from '$lib/data/config';
    import {
        skip,
        playPause,
        changeVerse,
        format,
        seek,
        updatePlaybackSpeed
    } from '$lib/data/audio';

    function mayResetPlayMode(hasTiming) {
        // If the current mode is repeatSelection and the reference is changed to something without timing
        // (even chapter without audio), then reset the playMode.  This matches how the Android app behaves.
        if (!hasTiming && $playMode.mode === 'repeatSelection') {
            playMode.reset();
        }
    }

    function seekAudio(event) {
        if (!$audioPlayer.loaded) return;
        const progressBar = document.getElementById('progress-bar');
        const percent = (event.clientX - progressBar.offsetLeft) / progressBar.offsetWidth;
        // Set the current time of the audio element to the corresponding time based on the percent
        seek($audioPlayer.duration * percent);
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
    let lastPlayMode = '';
    function playModeChanged(value) {
        let key = '';

        switch (value.mode) {
            case 'stop':
                key = 'Audio_Repeat_Off_Stop';
                break;
            case 'repeatPage':
                key = 'Audio_Repeat_Page';
                break;
            case 'repeatSelection':
                key = 'Audio_Repeat_Selection';
                break;
            case 'continue':
                key = 'Audio_Repeat_Off_Continue';
                break;
        }

        if (lastPlayMode !== '' && lastPlayMode !== value.mode) {
            startShowHint($t[key]);
        }
        lastPlayMode = value.mode;
    }
    $: playModeChanged($playMode);

    let hintText = '';
    let showHint = false;
    let hintTimeoutId = null;
    function startShowHint(text) {
        showHint = true;
        hintText = text;
        if (hintTimeoutId) {
            clearTimeout(hintTimeoutId);
        }
        hintTimeoutId = setTimeout(() => {
            showHint = false;
            hintTimeoutId = null;
        }, 1500);
    }

    const showSpeed = config.mainFeatures['settings-audio-speed'];
    const showRepeatMode = config.mainFeatures['audio-repeat-mode-button'];
    const playIconSize = config.mainFeatures['audio-play-button-size'] === 'normal' ? '24' : '48';
    const playIcon = playIconOptons[config.mainFeatures['audio-play-button-style']];
    const hintStyle = convertStyle($s['ui.bar.audio.hint.text']);
    //$: durationDisplay = format($audioPlayer.duration);
    $: iconColor = $s['ui.bar.audio.icon']['color'];
    $: iconPlayColor = $s['ui.bar.audio.play.icon']['color'];
    $: backgroundColor = $s['ui.bar.audio']['background-color'];
    $: audioBarClass = $refs.hasAudio?.timingFile ? 'audio-bar' : 'audio-bar-progress';
    $: mayResetPlayMode($refs.hasAudio?.timing);
    $: updatePlaybackSpeed($userSettings['audio-speed']);
</script>

<div class="relative {audioBarClass}" style:background-color={backgroundColor}>
    {#if showHint}
        <div
            style={hintStyle}
            class="absolute flex flex-row justify-center -top-[3rem] p-2 w-full left-1/2 -translate-x-1/2 max-w-screen-md shadow-md"
        >
            {hintText}
        </div>
    {/if}
    {#if showRepeatMode}
        <button
            class="audio-control-buttons"
            on:click={() => playMode.next($refs.hasAudio?.timingFile)}
        >
            <svelte:component this={playModeIconOptions[$playMode.mode]} color={iconColor} />
        </button>
    {/if}
    <!-- Play Controls -->
    <div class="audio-controls" style:direction="ltr">
        <button class="audio-control-buttons" on:click={() => skip(-1)}>
            <AudioIcon.Prev color={iconColor} />
        </button>

        {#if $refs.hasAudio?.timingFile}
            <button class="audio-control-buttons" on:click={() => changeVerse(-1)}>
                <AudioIcon.RW color={iconColor} />
            </button>
        {/if}
        <button class="audio-control-buttons" on:click={() => playPause()}>
            {#if !$audioPlayer.playing}
                <svelte:component this={playIcon} color={iconPlayColor} size={playIconSize} />
            {:else}
                <AudioIcon.Pause color={iconColor} size={playIconSize} />
            {/if}
        </button>
        {#if $refs.hasAudio?.timingFile}
            <button class="audio-control-buttons" on:click={() => changeVerse(1)}>
                <AudioIcon.FF color={iconColor} />
            </button>
        {/if}
        <button class="audio-control-buttons" on:click={() => skip(1)}>
            <AudioIcon.Skip color={iconColor} />
        </button>
    </div>
    <div class="audio-speed audio-control-buttons">
        {#if showSpeed}
            <AudioPlaybackSpeed />
        {/if}
    </div>
    {#if !$refs.hasAudio.timingFile}
        <!-- Progress Bar -->
        <div class="audio-progress-value text-sm">
            {format($audioPlayer.progress)}
        </div>
        {#if $audioPlayer.loaded}
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
            <progress
                id="progress-bar"
                class="dy-progress audio-progress"
                value={$audioPlayer.progress}
                max={$audioPlayer.duration}
                on:click={seekAudio}
            />
        {:else}
            <progress class="dy-progress audio-progress" value="0" max="1" />
        {/if}
        <div class="audio-progress-duration text-sm">
            {format($audioPlayer.duration)}
        </div>
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
        display: inline-flex;
        grid-row: 1;
        grid-column: 2;
        place-self: center;
        align-items: center;
    }
    .audio-control-buttons {
        margin-inline-start: 12px;
        margin-inline-end: 12px;
        place-self: center;
    }
    .audio-speed {
        grid-row: 1;
        grid-column: 3;
        place-self: center;
    }
</style>
