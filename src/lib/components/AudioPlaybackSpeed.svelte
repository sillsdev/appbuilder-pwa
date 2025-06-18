<script>
    import { monoIconColor, t, userSettings } from '$lib/data/stores';
    import Modal from './Modal.svelte';

    let modalId = 'playback';

    // Array of speed options
    const speeds = [
        { value: '0.4', label: '0.4x' },
        { value: '0.6', label: '0.6x' },
        { value: '0.7', label: '0.7x' },
        { value: '0.8', label: '0.8x' },
        { value: '0.9', label: '0.9x' },
        { value: '1.0', label: $t['Settings_Audio_Speed_Normal'] },
        { value: '1.1', label: '1.1x' },
        { value: '1.2', label: '1.2x' },
        { value: '1.3', label: '1.3x' },
        { value: '1.4', label: '1.4x' },
        { value: '1.6', label: '1.6x' }
    ];

    function setPlaySpeed(event) {
        $userSettings['audio-speed'] = event.target.value;
    }

    let modalThis;
    export function showModal() {
        modalThis.showModal();
    }
</script>

<Modal bind:this={modalThis} id={modalId}>
    <div style="color: {$monoIconColor}">
        <h1>
            <b>{$t['Settings_Audio_Speed']}</b>
        </h1>
        <div class="speed-controls">
            {#each speeds as { value, label }}
                <label>
                    <input
                        type="radio"
                        name="speed"
                        {value}
                        on:click={setPlaySpeed}
                        checked={$userSettings['audio-speed'] === value}
                    />
                    {label}
                </label>
            {/each}
            <div class="dy-modal-action close-btn">
                <button class="dy-btn dy-btn-ghost">{$t['Button_Close']}</button>
            </div>
        </div>
    </div>
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
