<script>
    import { AudioIcon } from '$lib/icons';
    import { s } from '$lib/data/stores';
    import Modal from './Modal.svelte';
    import { onMount } from 'svelte';
    import { setDefaultStorage } from '../data/stores/storage';
    //import { mergeDefaultStorage } from '/data/stores/storage';
    export let audio;
    let playbackSpeed = 1;
    let modalId = 'playback';

    onMount(() => {
        const storedSpeed = localStorage.getItem('playbackSpeed');
        if (storedSpeed !== null) {
            playbackSpeed = parseFloat(storedSpeed);
            audio.playbackRate = playbackSpeed;
        }
    });

    function setPlaySpeed(event) {
        const speed = parseFloat(event.target.value);
        audio.playbackRate = speed;
        setDefaultStorage('playbackSpeed', speed);
    }

    $: iconColor = $s['ui.bar.audio.icon']['color'];
</script>

<Modal id={modalId}>
    <svelte:fragment slot="label">
        <AudioIcon.Speed color={iconColor} />
    </svelte:fragment>
    <svelte:fragment slot="content">
        <h1>
            <b style="">Playback Speed</b>
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
            <div class="dy-modal-action close-btn">
                <label for={modalId} class="dy-btn dy-btn-ghost">Close</label>
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
