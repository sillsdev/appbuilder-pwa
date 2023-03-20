<script>
    import { refs, s } from '$lib/data/stores';
    import config from '$lib/data/config';
    import AudioBar from '$lib/components/AudioBar.svelte';

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
    $: themeColor = $s['ui.bar.action']['background-color'];
    $: dialogBackgroundColor = $s['ui.dialog']['background-color'];
    $: mayResetPlayMode($refs.hasAudio?.timing);
</script>

{#if isPopupOpen}
    <div class="popup">
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <div class="overlay" on:click={closePopup} />
        <div
            class="popup-content"
            class:dark={$themeColor === 'Dark'}
            style="background-color:{dialogBackgroundColor};"
        >
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
                    <input type="radio" name="speed" value="1" on:click={setPlaySpeed} checked />
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

<style>
    div.dark {
        color: #e0e0e0;
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
