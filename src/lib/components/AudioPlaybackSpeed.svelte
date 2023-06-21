<script>
    import { AudioIcon } from '$lib/icons';
    import { s, t, userSettings } from '$lib/data/stores';
    import Modal from './Modal.svelte';

    let modalId = 'playback';

    function setPlaySpeed(event) {
        $userSettings['audio-speed'] = event.target.value;
    }

    $: iconColor = $s['ui.bar.audio.icon']['color'];
</script>

<Modal id={modalId} addCSS="position:absolute; bottom:1rem; right:1rem;"
    ><!--addCSS injects CSS into the modal to position it 1rem away from the bottom and right edges of the screen (on mobile it will be centered)-->
    <svelte:fragment slot="label">
        <AudioIcon.Speed color={iconColor} />
    </svelte:fragment>
    <svelte:fragment slot="content">
        <h1>
            <b style="">{$t['Settings_Audio_Speed']}</b>
        </h1>
        <div class="speed-controls">
            <label>
                <input
                    type="radio"
                    name="speed"
                    value="0.4"
                    on:click={setPlaySpeed}
                    checked={$userSettings['audio-speed'] === '0.4'}
                />
                0.4x
            </label>
            <label>
                <input
                    type="radio"
                    name="speed"
                    value="0.6"
                    on:click={setPlaySpeed}
                    checked={$userSettings['audio-speed'] === '0.6'}
                />
                0.6x
            </label>
            <label>
                <input
                    type="radio"
                    name="speed"
                    value="0.7"
                    on:click={setPlaySpeed}
                    checked={$userSettings['audio-speed'] === '0.7'}
                />
                0.7x
            </label>
            <label>
                <input
                    type="radio"
                    name="speed"
                    value="0.8"
                    on:click={setPlaySpeed}
                    checked={$userSettings['audio-speed'] === '0.8'}
                />
                0.8x
            </label>
            <label>
                <input
                    type="radio"
                    name="speed"
                    value="1"
                    on:click={setPlaySpeed}
                    checked={$userSettings['audio-speed'] === '1.0'}
                />
                {$t['Settings_Audio_Speed_Normal']}
            </label>
            <label>
                <input
                    type="radio"
                    name="speed"
                    value="1.2"
                    on:click={setPlaySpeed}
                    checked={$userSettings['audio-speed'] === '1.2'}
                />
                1.2x
            </label>
            <label>
                <input
                    type="radio"
                    name="speed"
                    value="1.4"
                    on:click={setPlaySpeed}
                    checked={$userSettings['audio-speed'] === '1.4'}
                />
                1.4x
            </label>
            <label>
                <input
                    type="radio"
                    name="speed"
                    value="1.6"
                    on:click={setPlaySpeed}
                    checked={$userSettings['audio-speed'] === '1.6'}
                />
                1.6x
            </label>
            <div class="dy-modal-action close-btn">
                <button class="dy-btn dy-btn-ghost">{$t['Button_Close']}</button>
            </div>
        </div>
    </svelte:fragment>
</Modal>

<style>
    .close-btn {
        display: flex;
        justify-content: center;
        margin: 0 auto;
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
